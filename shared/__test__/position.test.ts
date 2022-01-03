import * as assert from "assert";

import { Position, Range } from "../messages/position";

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

  describe("equals", () => {
    const pos_l1c1 = new Position(1, 1)
    const pos_l1c2 = new Position(1, 2)
    test("equals", () => {
      assert.ok(pos_l1c1.equals(pos_l1c1))
      assert.ok(pos_l1c2.equals(pos_l1c2))
    })

    test("not equals", () => {
      assert.ok(!pos_l1c1.equals(pos_l1c2))
      assert.ok(!pos_l1c2.equals(pos_l1c1))
    })
  })
});

describe("Range", () => {
  describe("contains", () => {
    test("different uri", () => {
      const range1 = new Range(
        "a.text",
        new Position(0, 0),
        new Position(0, 1),
      )
      const range2 = new Range(
        "b.text",
        new Position(0, 0),
        new Position(0, 1),
      )
      assert.ok(!range1.contains(range2))
    })

    test("equal", () => {
      const range = new Range(
        "a.text",
        new Position(0, 0),
        new Position(0, 1),
      )
      assert.ok(range.contains(range))
    })

    test("intersect (not contained)", () => {
      const range1 = new Range(
        "a.text",
        new Position(1, 10),
        new Position(2, 10),
      )
      const range2 = new Range(
        "a.text",
        new Position(2, 5),
        new Position(2, 15),
      )
      const range3 = new Range(
        "a.text",
        new Position(2, 10),
        new Position(3, 1),
      )

      assert.ok(!range1.contains(range2))
      assert.ok(!range1.contains(range3))
      assert.ok(!range2.contains(range1))
      assert.ok(!range2.contains(range3))
      assert.ok(!range3.contains(range1))
      assert.ok(!range3.contains(range2))
    })

    test("contains", () => {
      const outer = new Range(
        "a.text",
        new Position(1, 10),
        new Position(2, 10),
      )
      const inner = new Range(
        "a.text",
        new Position(1, 10),
        new Position(2, 5),
      )

      assert.ok(outer.contains(inner))
      assert.ok(!inner.contains(outer))
    })
  })

  describe("equals", () => {
    test("equals", () => {
      const range = new Range(
        "a.text",
        new Position(1, 10),
        new Position(2, 10),
      )
      assert.ok(range.equals(range))
    })

    test("not equals", () => {
      const range1 = new Range(
        "a.text",
        new Position(1, 10),
        new Position(2, 10),
      )
      const range2 = new Range(
        "a.text",
        new Position(1, 10),
        new Position(2, 11),
      )
      assert.ok(!range1.equals(range2))

    })
  })
})
