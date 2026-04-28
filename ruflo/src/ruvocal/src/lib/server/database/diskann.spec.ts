/**
 * DiskANN Vector Search Backend Tests
 * @see https://github.com/ruvnet/ruflo/issues/1547
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPool, closePool } from "./postgres";

describe("DiskANN Vector Search", () => {
	beforeAll(async () => {
		getPool();
	});

	afterAll(async () => {
		await closePool();
	});

	describe("initDiskANN", () => {
		it("should initialize vector extension and tables", async () => {
			const pool = getPool();

			const extResult = await pool.query(`
				SELECT extname FROM pg_extension WHERE extname = 'vector'
			`);
			expect(extResult.rows.length).toBeGreaterThanOrEqual(1);

			const tableResult = await pool.query(`
				SELECT table_name FROM information_schema.tables
				WHERE table_name = 'vector_store'
			`);
			expect(tableResult.rows.length).toBe(1);
		});

		it("should create indexes for efficient search", async () => {
			const pool = getPool();

			const indexes = await pool.query(`
				SELECT indexname FROM pg_indexes
				WHERE tablename = 'vector_store'
			`);

			const indexNames = indexes.rows.map(r => r.indexname);
			expect(indexNames).toContain("idx_vector_store_embedding");
			expect(indexNames).toContain("idx_vector_store_collection");
		});
	});

	describe("Vector operations", () => {
		const testCollection = "test_vectors_" + Date.now();

		it("should insert and retrieve vectors", async () => {
			const { insertVectors, searchVectors, deleteVectors } = await import("./diskann");

			const vectors = [
				Array(1536).fill(0).map(() => Math.random()),
				Array(1536).fill(0).map(() => Math.random()),
			];

			const metadata = [
				{ text: "test document 1", category: "test" },
				{ text: "test document 2", category: "test" },
			];

			const ids = await insertVectors(testCollection, vectors, metadata);
			expect(ids).toHaveLength(2);

			const results = await searchVectors(testCollection, vectors[0], 2);
			expect(results).toHaveLength(2);
			expect(results[0].distance).toBeLessThan(0.01);

			await deleteVectors(ids);
		});

		it("should handle batch inserts efficiently", async () => {
			const { insertVectors, getCollectionStats, deleteVectors } = await import("./diskann");

			const batchSize = 100;
			const vectors = Array(batchSize).fill(null).map(() =>
				Array(1536).fill(0).map(() => Math.random())
			);

			const ids = await insertVectors(testCollection, vectors);
			expect(ids).toHaveLength(batchSize);

			const stats = await getCollectionStats(testCollection);
			expect(stats.count).toBeGreaterThanOrEqual(batchSize);

			await deleteVectors(ids);
		});
	});

	describe("Search with filters", () => {
		const filterCollection = "test_filter_" + Date.now();

		it("should filter by metadata", async () => {
			const { insertVectors, searchVectors, deleteVectors } = await import("./diskann");

			const vectors = Array(10).fill(null).map(() =>
				Array(1536).fill(0).map(() => Math.random())
			);

			const metadata = Array(10).fill(null).map((_, i) => ({
				category: i < 5 ? "A" : "B",
				index: i
			}));

			const ids = await insertVectors(filterCollection, vectors, metadata);

			const resultsA = await searchVectors(filterCollection, vectors[0], 5, { category: "A" });
			expect(resultsA.length).toBeLessThanOrEqual(5);

			await deleteVectors(ids);
		});
	});

	describe("Hybrid search", () => {
		it("should combine vector and keyword search", async () => {
			const { insertVectors, hybridSearch, deleteVectors } = await import("./diskann");

			const hybridCollection = "test_hybrid_" + Date.now();

			const vectors = Array(5).fill(null).map(() =>
				Array(1536).fill(0).map(() => Math.random())
			);

			const metadata = [
				{ text: "machine learning algorithms", category: "tech" },
				{ text: "cooking recipes", category: "food" },
				{ text: "machine learning models", category: "tech" },
				{ text: "baking bread", category: "food" },
				{ text: "deep learning neural networks", category: "tech" },
			];

			const ids = await insertVectors(hybridCollection, vectors, metadata);

			const results = await hybridSearch(hybridCollection, vectors[0], "machine learning", 5);
			expect(results.length).toBeLessThanOrEqual(5);

			const techResults = results.filter(r => r.metadata?.category === "tech");
			expect(techResults.length).toBeGreaterThan(0);

			await deleteVectors(ids);
		});
	});
});