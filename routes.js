const express = require("express");
const router = express.Router();
const db = require("./db");
const haversine = require('haversine-distance');

const metersPerMile = 1609.334;

router.get("/users", async function (req, res, next) {
    try {
        const { fav_color, min_age, max_age, dist, origin } = req.query;

        const result = await db.query(
            'SELECT user_id, user_name, user_age, user_fav_color, last_location, lat, long FROM users WHERE user_fav_color = $1 AND user_age >= $2 AND user_age <= $3',
            [fav_color, min_age, max_age]);

        for (let row of result.rows) {
          if (origin) {
            const a = [row.lat, row.long];
            const b = origin.split(',');   
            // use haversine formula to calculate distance between two points using lat/long coordinates
            const distInMeters = (haversine(a,b)); 
            const distInMiles = Math.ceil(distInMeters/metersPerMile);  
            if (distInMiles <= dist) { console.log(distInMiles, dist)
              console.log("IS WITHIN DISTANCE");
              // need to push these to results
            }
          }
        }
               
        /**  https://leafletjs.com/examples/geojson/)*/

        // This works well EXCEPT when multiple locations exist for single user; then we get same user listed twice.
        const metadata = {
            "path": "/users",
            "query": {
              "user_fav_color": fav_color,
              "dist": dist,
              "origin": origin,
              "min_age": min_age,
              "max_age": max_age
            }
          };
        
        const results =[];
        
        for (let row of result.rows) { 
          const { user_id, user_name, user_age, user_fav_color, last_location, lat, long } = row;

          results.push(
            {"type": "user",
            "locationHistory": {
              "type": "FeatureCollection",
              "features":
              [
                {
                  "type": "Feature",
                  "properties": {
                    "city": last_location
                  },
                  "geometry": {
                    "type": "Point",
                    "coordinates": [lat,long]
                  }
                }
              ]
            },
            "properties":
              {
                "id": user_id,
                "name": user_name, 
                "age": user_age,
                "fav_color": user_fav_color
              }
          });
        }       

        return res.json({
            "metadata": metadata,
            "num_results": result.rows.length,
            "results": results
          });
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;