/// <reference path="../pb_data/types.d.ts" />
// T0.6 — Event logging. Deliberately a SEPARATE collection from
// `student_memory` (which holds encrypted Layer 1/2 blobs): event bodies are
// plaintext by design and must never carry email/name/IP-derived identifiers.
// See 07-app/core/telemetry.js for the writer and the privacy guard.
migrate((db) => {
  const collection = new Collection({
    "id": "ev3nts0000000001",
    "created": "2026-09-05 00:00:00.000Z",
    "updated": "2026-09-05 00:00:00.000Z",
    "name": "events",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "event_field",
        "name": "event",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "ts_field",
        "name": "ts",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "session_id_field",
        "name": "sessionId",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "anon_id_field",
        "name": "anonId",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "lesson_id_field",
        "name": "lessonId",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "payload_field",
        "name": "payload",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 20000
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_events_anonId` ON `events` (`anonId`)",
      "CREATE INDEX `idx_events_event` ON `events` (`event`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": "",
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("ev3nts0000000001");

  return dao.deleteCollection(collection);
})
