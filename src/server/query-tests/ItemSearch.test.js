import gql from "graphql-tag";
import { query, getDbCalls } from "./setup.js";

describe("ItemSearch", () => {
  it("loads Neopian Times items", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearch(query: "Neopian Times") {
            query
            items {
              id
              name
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchSnapshot();
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT items.*, t.name FROM items
               INNER JOIN item_translations t ON t.item_id = items.id
               WHERE t.name LIKE ? AND t.name LIKE ? AND t.locale=\\"en\\"
               ORDER BY t.name
               LIMIT 30",
          Array [
            "%Neopian%",
            "%Times%",
          ],
        ],
      ]
    `);
  });

  it("searches for each word separately", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearch(query: "Tarla Workshop") {
            query
            items {
              id
              name
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchInlineSnapshot(`
      Object {
        "itemSearch": Object {
          "items": Array [
            Object {
              "id": "50377",
              "name": "Tarlas Underground Workshop Background",
            },
          ],
          "query": "Tarla Workshop",
        },
      }
    `);
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT items.*, t.name FROM items
               INNER JOIN item_translations t ON t.item_id = items.id
               WHERE t.name LIKE ? AND t.name LIKE ? AND t.locale=\\"en\\"
               ORDER BY t.name
               LIMIT 30",
          Array [
            "%Tarla%",
            "%Workshop%",
          ],
        ],
      ]
    `);
  });

  it("loads Neopian Times items that fit the Starry Zafara", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearchToFit(
            query: "Neopian Times"
            speciesId: "54"
            colorId: "75"
          ) {
            query
            items {
              id
              name
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchSnapshot();
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT * FROM pet_types WHERE (species_id = ? AND color_id = ?)",
          Array [
            "54",
            "75",
          ],
        ],
        Array [
          "SELECT DISTINCT items.*, t.name FROM items
                 INNER JOIN item_translations t ON t.item_id = items.id
                 INNER JOIN parents_swf_assets rel
                     ON rel.parent_type = \\"Item\\" AND rel.parent_id = items.id
                 INNER JOIN swf_assets ON rel.swf_asset_id = swf_assets.id
                 WHERE t.name LIKE ? AND t.name LIKE ? AND t.locale=\\"en\\" AND
                     (swf_assets.body_id = ? OR swf_assets.body_id = 0) AND
                     1
                 ORDER BY t.name
                 LIMIT ? OFFSET ?",
          Array [
            "%Neopian%",
            "%Times%",
            "180",
            30,
            0,
          ],
        ],
      ]
    `);
  });

  it("loads Neopian Times items that fit the Starry Zafara as a Background", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearchToFit(
            query: "Neopian Times"
            speciesId: "54"
            colorId: "75"
            zoneIds: ["3"]
          ) {
            query
            items {
              id
              name
            }
            zones {
              id
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchInlineSnapshot(`
      Object {
        "itemSearchToFit": Object {
          "items": Array [
            Object {
              "id": "40431",
              "name": "Neopian Times Background",
            },
          ],
          "query": "Neopian Times",
          "zones": Array [
            Object {
              "id": "3",
            },
          ],
        },
      }
    `);
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT * FROM pet_types WHERE (species_id = ? AND color_id = ?)",
          Array [
            "54",
            "75",
          ],
        ],
        Array [
          "SELECT DISTINCT items.*, t.name FROM items
                 INNER JOIN item_translations t ON t.item_id = items.id
                 INNER JOIN parents_swf_assets rel
                     ON rel.parent_type = \\"Item\\" AND rel.parent_id = items.id
                 INNER JOIN swf_assets ON rel.swf_asset_id = swf_assets.id
                 WHERE t.name LIKE ? AND t.name LIKE ? AND t.locale=\\"en\\" AND
                     (swf_assets.body_id = ? OR swf_assets.body_id = 0) AND
                     swf_assets.zone_id IN (?)
                 ORDER BY t.name
                 LIMIT ? OFFSET ?",
          Array [
            "%Neopian%",
            "%Times%",
            "180",
            "3",
            30,
            0,
          ],
        ],
      ]
    `);
  });

  it("searches for each word separately (fit mode)", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearchToFit(
            query: "Tarla Workshop"
            speciesId: "54"
            colorId: "75"
          ) {
            query
            items {
              id
              name
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchInlineSnapshot(`
      Object {
        "itemSearchToFit": Object {
          "items": Array [
            Object {
              "id": "50377",
              "name": "Tarlas Underground Workshop Background",
            },
          ],
          "query": "Tarla Workshop",
        },
      }
    `);
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT * FROM pet_types WHERE (species_id = ? AND color_id = ?)",
          Array [
            "54",
            "75",
          ],
        ],
        Array [
          "SELECT DISTINCT items.*, t.name FROM items
                 INNER JOIN item_translations t ON t.item_id = items.id
                 INNER JOIN parents_swf_assets rel
                     ON rel.parent_type = \\"Item\\" AND rel.parent_id = items.id
                 INNER JOIN swf_assets ON rel.swf_asset_id = swf_assets.id
                 WHERE t.name LIKE ? AND t.name LIKE ? AND t.locale=\\"en\\" AND
                     (swf_assets.body_id = ? OR swf_assets.body_id = 0) AND
                     1
                 ORDER BY t.name
                 LIMIT ? OFFSET ?",
          Array [
            "%Tarla%",
            "%Workshop%",
            "180",
            30,
            0,
          ],
        ],
      ]
    `);
  });

  it("loads the first 10 hats that fit the Starry Zafara", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearchToFit(
            query: "hat"
            speciesId: "54"
            colorId: "75"
            offset: 0
            limit: 10
          ) {
            query
            items {
              id
              name
              appearanceOn(speciesId: "54", colorId: "75") {
                layers {
                  id
                }
              }
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchSnapshot();
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT * FROM pet_types WHERE (species_id = ? AND color_id = ?)",
          Array [
            "54",
            "75",
          ],
        ],
        Array [
          "SELECT DISTINCT items.*, t.name FROM items
                 INNER JOIN item_translations t ON t.item_id = items.id
                 INNER JOIN parents_swf_assets rel
                     ON rel.parent_type = \\"Item\\" AND rel.parent_id = items.id
                 INNER JOIN swf_assets ON rel.swf_asset_id = swf_assets.id
                 WHERE t.name LIKE ? AND t.locale=\\"en\\" AND
                     (swf_assets.body_id = ? OR swf_assets.body_id = 0) AND
                     1
                 ORDER BY t.name
                 LIMIT ? OFFSET ?",
          Array [
            "%hat%",
            "180",
            10,
            0,
          ],
        ],
        Array [
          "SELECT sa.*, rel.parent_id FROM swf_assets sa
             INNER JOIN parents_swf_assets rel ON
               rel.parent_type = \\"Item\\" AND
               rel.swf_asset_id = sa.id
             WHERE (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0)) OR (rel.parent_id = ? AND (sa.body_id = ? OR sa.body_id = 0))",
          Array [
            "74967",
            "180",
            "49026",
            "180",
            "67242",
            "180",
            "64177",
            "180",
            "69995",
            "180",
            "62375",
            "180",
            "56654",
            "180",
            "62322",
            "180",
            "58733",
            "180",
            "80401",
            "180",
          ],
        ],
      ]
    `);
  });

  it("loads the next 10 hats that fit the Starry Zafara", async () => {
    const res = await query({
      query: gql`
        query {
          itemSearchToFit(
            query: "hat"
            speciesId: "54"
            colorId: "75"
            offset: 10
            limit: 10
          ) {
            query
            items {
              id
              name
            }
          }
        }
      `,
    });

    expect(res).toHaveNoErrors();
    expect(res.data).toMatchSnapshot();
    expect(getDbCalls()).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT * FROM pet_types WHERE (species_id = ? AND color_id = ?)",
          Array [
            "54",
            "75",
          ],
        ],
        Array [
          "SELECT DISTINCT items.*, t.name FROM items
                 INNER JOIN item_translations t ON t.item_id = items.id
                 INNER JOIN parents_swf_assets rel
                     ON rel.parent_type = \\"Item\\" AND rel.parent_id = items.id
                 INNER JOIN swf_assets ON rel.swf_asset_id = swf_assets.id
                 WHERE t.name LIKE ? AND t.locale=\\"en\\" AND
                     (swf_assets.body_id = ? OR swf_assets.body_id = 0) AND
                     1
                 ORDER BY t.name
                 LIMIT ? OFFSET ?",
          Array [
            "%hat%",
            "180",
            10,
            10,
          ],
        ],
      ]
    `);
  });
});
