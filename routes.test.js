const request = require("supertest");
const app = require("./app");
const db = require ("./db");


describe("GET /users", () => {
    test("Get list of all users; no filters applied", async () => {
        const res = await request(app).get("/users");
        expect(res.statusCode).toBe(200);
        expect(res.body.num_results).toBe(7);
    });

    test("Get list of users with favorite color filter applied", async () => {
        const res = await request(app).get("/users?fav_color=green");
        expect(res.statusCode).toBe(200);
        expect(res.body.num_results).toBe(2);
        expect(res.body.results[0].properties.name).toBe("Idris Elba");
        expect(res.body.results[1].properties.name).toBe("Chris Martin");
    });

    test("Get list of users with age filters applied", async () => {
        const res = await request(app).get("/users?min_age=30&max_age=40");
        expect(res.statusCode).toBe(200);
        expect(res.body.num_results).toBe(2);
        expect(res.body.results[0].properties.name).toBe("Emilia Clarke");
        expect(res.body.results[1].properties.name).toBe("Chris Martin");
    });

    test("Get list of users with distance filter applied", async () => {
        const res = await request(app).get("/users?dist=100&origin=37.774929,-122.419416");
        expect(res.statusCode).toBe(200);
        expect(res.body.num_results).toBe(3);
        
        const res2 = await request(app).get("/users?dist=100&origin=19.610825, -155.967798");
        expect(res2.statusCode).toBe(200);
        expect(res2.body.num_results).toBe(0);
    });

    test("Get list of users with favorite color and age filter applied", async () => {
        const res = await request(app).get("/users?fav_color=green&max_age=45");
        expect(res.statusCode).toBe(200);
        expect(res.body.num_results).toBe(1);
        expect(res.body.results[0].properties.name).toBe("Chris Martin");
    });

    test("Get list of users with all filters applied", async () => {
        const res = await request(app).get("/users?fav_color=blue&max_age=40&dist=50&origin=37.774929,-122.419416");
        expect(res.statusCode).toBe(200);
        expect(res.body.num_results).toBe(1);
        expect(res.body.results[0].properties.name).toBe("Emma Watson");

        const res2 = await request(app).get("/users?fav_color=blue&max_age=25&dist=50&origin=37.774929,-122.419416");
        expect(res2.statusCode).toBe(200);
        expect(res2.body.num_results).toBe(0);
        expect(res2.body.results).toStrictEqual([]);
    });
});

afterAll(async() => {
    await db.end();
});