import test from "node:test";
import assert from "node:assert/strict";
import { buildPaginationMeta, hasPaginationQuery, parsePagination } from "../src/utils/pagination.js";

test("parsePagination clamps page and limit", () => {
  assert.deepEqual(parsePagination({ page: "-2", limit: "500" }), {
    page: 1,
    limit: 100,
    skip: 0,
    take: 100
  });
});

test("parsePagination computes offset", () => {
  assert.deepEqual(parsePagination({ page: "3", limit: "20" }), {
    page: 3,
    limit: 20,
    skip: 40,
    take: 20
  });
});

test("hasPaginationQuery only activates explicit pagination", () => {
  assert.equal(hasPaginationQuery({}), false);
  assert.equal(hasPaginationQuery({ page: "1" }), true);
  assert.equal(hasPaginationQuery({ limit: "25" }), true);
});

test("buildPaginationMeta returns at least one page", () => {
  assert.deepEqual(buildPaginationMeta({ page: 1, limit: 25, total: 0 }), {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1
  });
});
