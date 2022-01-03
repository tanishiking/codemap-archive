import * as assert from "assert";

import { Position } from "../messages/position";

describe("Position", () => {
  describe("isAfterOrEq", () => {
    const pos_l1c1 = new Position(1, 1)
    const pos_l1c2 = new Position(1, 2)
    const pos_l2c1 = new Position(2, 1)
    test("equal", () => {
      assert.ok(pos_l1c1.isAfterOrEq(pos_l1c1))
    });

    test("line after", () => {
      assert.ok(pos_l2c1.isAfterOrEq(pos_l1c1))
      assert.ok(pos_l2c1.isAfterOrEq(pos_l1c2))
    })

    test("same line", () => {
      assert.ok(pos_l1c2.isAfterOrEq(pos_l1c1))
    })

    test("false", () => {
      assert.ok(!pos_l1c1.isAfterOrEq(pos_l1c2))
    })
  });

  describe("isBeforeOrEq", () => {
    const pos_l1c1 = new Position(1, 1)
    const pos_l1c2 = new Position(1, 2)
    const pos_l2c1 = new Position(2, 1)
    test("equal", () => {
      assert.ok(pos_l1c1.isBeforeOrEq(pos_l1c1))
    });

    test("line before", () => {
      assert.ok(pos_l1c1.isBeforeOrEq(pos_l2c1))
      assert.ok(pos_l1c2.isBeforeOrEq(pos_l2c1))
    })

    test("same line", () => {
      assert.ok(pos_l1c1.isBeforeOrEq(pos_l1c2))
    })

    test("false", () => {
      assert.ok(!pos_l1c2.isBeforeOrEq(pos_l1c1))
    })
  });
});

