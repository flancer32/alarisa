// @ts-check

/**
 * @namespace Alarisa_State_WorldMap_Import
 * @description Imports one validated World Map snapshot into the State DEM.
 */

const EXTENSION_NAMESPACE = "alarisa.world-map";
const EXTENSION_VERSION = 1;
const SOURCE = "ctx/agent/world-map-2026-08-19.yaml";
const ENTITY_NAMESPACE = "@flancer32/alarisa-back-state/alarisa/state";

/**
 * @param {TeqFw_Db_Back_RDb_ITrans} trx
 * @param {string} entity
 * @returns {string}
 */
export function tableName(trx, entity) {
  return trx.getTableName(/** @type {any} */ ({getEntityName: () => `${ENTITY_NAMESPACE}/${entity}`}));
}

/** @param {unknown} value @returns {object[]} */
export function validate(value) {
  if (!Array.isArray(value) || value.length === 0) throw new TypeError("World Map must be a non-empty YAML array.");
  const refs = new Set();
  for (const record of value) {
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("Every World Map record must be an object.");
    const {ref, components, relations = []} = record;
    if (typeof ref !== "string" || !ref) throw new TypeError("Every World Map record requires a non-empty ref.");
    if (refs.has(ref)) throw new TypeError(`World Map ref '${ref}' is duplicated.`);
    refs.add(ref);
    if (!Array.isArray(components) || components.length === 0) throw new TypeError(`World Map record '${ref}' requires components.`);
    for (const component of components) {
      if (!component || typeof component.type !== "string" || !component.type) throw new TypeError(`World Map record '${ref}' has an invalid component type.`);
      if (component.properties !== undefined && (!component.properties || typeof component.properties !== "object" || Array.isArray(component.properties))) throw new TypeError(`World Map record '${ref}' has invalid component properties.`);
    }
    if (!Array.isArray(relations)) throw new TypeError(`World Map record '${ref}' has invalid relations.`);
    for (const relation of relations) if (!relation || typeof relation.type !== "string" || !relation.type || typeof relation.target !== "string" || !relation.target) throw new TypeError(`World Map record '${ref}' has an invalid relation.`);
  }
  for (const record of value) for (const relation of record.relations ?? []) if (!refs.has(relation.target)) throw new TypeError(`World Map relation '${record.ref}' -> '${relation.target}' has an unknown target.`);
  const caseRefs = new Set(value.filter((record) => record.components.some((component) => component.type === "case")).map((record) => record.ref));
  const parentByChild = new Map();
  for (const record of value) for (const relation of record.relations ?? []) if (relation.type === "case-parent") {
    if (!caseRefs.has(record.ref) || !caseRefs.has(relation.target)) throw new TypeError("A case-parent relation must connect two case records.");
    if (parentByChild.has(record.ref)) throw new TypeError(`Case '${record.ref}' has more than one case-parent relation.`);
    parentByChild.set(record.ref, relation.target);
  }
  for (const ref of caseRefs) {
    const visited = new Set();
    for (let current = ref; parentByChild.has(current); current = parentByChild.get(current)) {
      if (visited.has(current)) throw new TypeError(`A case-parent cycle includes '${current}'.`);
      visited.add(current);
    }
  }
  return value;
}

/** @param {object[]} records @returns {object[]} */
export function normalize(records) {
  return records.map((record) => ({
    ...record,
    components: record.components.map((component) => ({...component, type: component.type.toLowerCase()})),
    relations: (record.relations ?? []).map((relation, index, relations) => ({
      ...relation,
      type: relation.type === "part-of" && relations.findIndex((candidate) => candidate.type === "part-of") === index ? "case-parent" : relation.type,
    })),
  }));
}

/**
 * @param {object} deps
 * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
 */
export default class Import {
  /**
   * @param {object} deps
   * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
   */
  constructor({connection}) {
    /**
     * @param {unknown} source
     * @returns {Promise<object>}
     */
    this.execute = async function (source) {
      const records = normalize(validate(source));
      const trx = await connection.startTransaction();
      const knex = trx.getKnexTrx();
      try {
        await trx.raw("SELECT pg_advisory_xact_lock(?)", [20260819]);
        const markerRows = await knex(tableName(trx, "object/extension")).where({namespace: EXTENSION_NAMESPACE, version: EXTENSION_VERSION}).whereRaw("data->>'source' = ?", [SOURCE]).select("data");
        const importedRefs = new Set(markerRows.map((row) => (typeof row.data === "string" ? JSON.parse(row.data) : row.data).ref));
        const relationCount = records.reduce((total, record) => total + (record.relations?.length ?? 0), 0);
        if (importedRefs.size > 0) {
          if (importedRefs.size !== records.length || records.some((record) => !importedRefs.has(record.ref))) throw new Error("A partial or different World Map snapshot is already present; automatic merge is forbidden.");
          await trx.commit();
          return {status: "already-imported", objects: records.length, relations: relationCount};
        }
        const componentTypeIds = await ensureTypes(knex, tableName(trx, "component/type"), new Set(records.flatMap((record) => record.components.map((component) => component.type))), undefined);
        const propertyTypeIds = await ensureTypes(knex, tableName(trx, "property/type"), new Set(records.flatMap((record) => record.components.flatMap((component) => Object.keys(component.properties ?? {})))), "json");
        const relationTypeIds = await ensureTypes(knex, tableName(trx, "relation/type"), new Set(records.flatMap((record) => (record.relations ?? []).map((relation) => relation.type))), undefined);
        const objectIds = new Map();
        for (const record of records) {
          const [created] = await knex(tableName(trx, "object")).insert({}).returning("id");
          const objectId = Number(created.id ?? created);
          objectIds.set(record.ref, objectId);
          await knex(tableName(trx, "object/extension")).insert({object_id: objectId, namespace: EXTENSION_NAMESPACE, version: EXTENSION_VERSION, data: JSON.stringify({source: SOURCE, ref: record.ref, record})});
          for (const component of record.components) {
            const [createdComponent] = await knex(tableName(trx, "component")).insert({object_id: objectId, type_id: componentTypeIds.get(component.type)}).returning("id");
            const componentId = Number(createdComponent.id ?? createdComponent);
            for (const [code, value] of Object.entries(component.properties ?? {})) await knex(tableName(trx, "property")).insert({component_id: componentId, type_id: propertyTypeIds.get(code), value: JSON.stringify(value)});
          }
        }
        for (const record of records) for (const relation of record.relations ?? []) await knex(tableName(trx, "relation")).insert({source_object_id: objectIds.get(record.ref), relation_type_id: relationTypeIds.get(relation.type), target_object_id: objectIds.get(relation.target)});
        await trx.commit();
        return {status: "imported", objects: records.length, relations: relationCount};
      } catch (error) {
        try {
          await trx.rollback();
        } catch (_) {
          // The import failure is the contract-relevant error.
        }
        throw error;
      }
    };
  }
}

/**
 * @param {Knex} knex
 * @param {string} table
 * @param {Set<string>} codes
 * @param {string|undefined} valueType
 * @returns {Promise<object>}
 */
async function ensureTypes(knex, table, codes, valueType) {
  for (const code of codes) await knex(table).insert(valueType === undefined ? {code} : {code, value_type: valueType}).onConflict("code").ignore();
  const rows = await knex(table).whereIn("code", [...codes]).select("id", "code");
  if (rows.length !== codes.size) throw new Error(`Could not resolve all vocabulary entries in ${table}.`);
  return new Map(rows.map((row) => [row.code, Number(row.id)]));
}

export const __deps__ = Object.freeze({default: Object.freeze({connection: "TeqFw_Db_Back_RDb_Connect$"})});
