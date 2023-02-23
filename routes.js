const express = require("express");
const router = express.Router();
const db = require("./db");
const haversine = require('haversine-distance');

const metersPerMile = 1609.334;

router.get("/users", async function (req, res, next) {
    try {
        const { fav_color, min_age, max_age, dist, origin } = req.query;

        const result = await db.query(
          'SELECT user_id, user_name, user_age, user_fav_color, last_location, lat, long FROM users');

        const users = result.rows;      

        // if querying by color, apply filter to results; otherwise, results remain the same
        let filteredByColor;
        if (fav_color) { 
          filteredByColor = users.filter(user => user.user_fav_color === fav_color);
        }
        else {
          filteredByColor = users;
        }

        // if querying by minimum age, apply filter to previous results; otherwise, results remain the same
        let filteredByMinAge
        if (min_age) {
          filteredByMinAge = filteredByColor.filter(user => user.user_age >= min_age);
        }
        else {
          filteredByMinAge = filteredByColor;
        }
        
        // if querying by maximum age, apply filter to previous results; otherwise, results remain the same
        let filteredByMaxAge;
        if (max_age) {
          filteredByMaxAge = filteredByMinAge.filter(user => user.user_age <= max_age);
        }
        else {
          filteredByMaxAge = filteredByMinAge;
        }
        
        let filteredUsers =[];        
          for (let user of filteredByMaxAge) {     
            if (origin && dist) {      
            const a = [user.lat, user.long];
            const b = origin.split(',');   
            // use haversine formula to calculate distance between two points using lat/long coordinates
            const distInMeters = (haversine(a,b)); 
            const distInMiles = Math.ceil(distInMeters/metersPerMile);  
            user["distanceFromOrigin"] = distInMiles;
            filteredUsers = filteredByMaxAge.filter(user => user.distanceFromOrigin <= dist);
          } 
          else {
            filteredUsers = filteredByMaxAge;
          }    
        }
               
        /**  https://leafletjs.com/examples/geojson/)*/

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
        
        // const results =[];
        
        // for (let row of result.rows) { 
        //   const { user_id, user_name, user_age, user_fav_color, last_location, lat, long } = row;

        //   results.push(
        //     {"type": "user",
        //     "locationHistory": {
        //       "type": "FeatureCollection",
        //       "features":
        //       [
        //         {
        //           "type": "Feature",
        //           "properties": {
        //             "city": last_location
        //           },
        //           "geometry": {
        //             "type": "Point",
        //             "coordinates": [lat,long]
        //           }
        //         }
        //       ]
        //     },
        //     "properties":
        //       {
        //         "id": user_id,
        //         "name": user_name, 
        //         "age": user_age,
        //         "fav_color": user_fav_color
        //       }
        //   });
        // }       

        return res.json({
            "metadata": metadata,
            "num_results": filteredUsers.length,
            "results": filteredUsers
          });

    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;