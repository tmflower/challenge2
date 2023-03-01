const express = require("express");
const router = express.Router();
const db = require("./db");
const haversine = require('haversine-distance');

const metersPerMile = 1609.334;

router.get("/users", async function (req, res, next) {
  try {
      const { favColor, minAge, maxAge, dist, origin } = req.query;

      // get all the users first
      const result = await db.query(
        'SELECT user_name, user_age, user_fav_color FROM users');

      const users = result.rows;      
      
      // if querying by color, apply filter to results; otherwise, results remain the same
      let filteredByColor;
      if (favColor) { 
        filteredByColor = users.filter(user => user.user_fav_color === favColor);
      }
      else {
        filteredByColor = users;
      }

      // if querying by minimum age, apply filter to previous results; otherwise, results remain the same
      let filteredByMinAge
      if (minAge) {
        filteredByMinAge = filteredByColor.filter(user => user.user_age >= minAge);
      }
      else {
        filteredByMinAge = filteredByColor;
      }
      
      // if querying by maximum age, apply filter to previous results; otherwise, results remain the same
      let filteredByMaxAge;
      if (maxAge) {
        filteredByMaxAge = filteredByMinAge.filter(user => user.user_age <= maxAge);
      }
      else {
        filteredByMaxAge = filteredByMinAge;
      }

      let userLocations = [];
      const names = filteredByMaxAge.map(user => user.user_name);
      for (let name of names) {
        let result = await db.query(`
        SELECT user_name, last_location FROM users_locations WHERE user_name = $1`, [name]);
        userLocations.push(result.rows);
      }
      
      let locationCoords=[];
      for (let location of userLocations) {
        let result = await db.query(`
        SELECT last_location, lat, long FROM locations WHERE last_location = $1`, [location[0].last_location]);
        locationCoords.push(result.rows);
      }

      let filteredLocations =[];        
        for (let coords of locationCoords) {
          if (origin && dist) { 
          const a = [coords[0].lat, coords[0].long];
          const b = origin.split(','); 
      //     // use haversine formula to calculate distance between two points using lat/long coordinates
          const distInMeters = (haversine(a,b)); 
          const distInMiles = Math.ceil(distInMeters/metersPerMile); 
          if (distInMiles <= dist) { 
            filteredLocations.push(coords);
          }
        }
      }

      for (let location of userLocations) {
        // console.log(filteredLocations[0])
        if (filteredLocations[0].last_location === location.last_location) {
          console.log(userLocations[0])
          let name = userLocations[0][0].user_name;
          console.log("NAME", name)
        }
      }
      
     


      return res.json({filteredByMaxAge, userLocations, locationCoords, filteredLocations});


      

      // const metadata = {
      //     "path": "/users",
      //     "query": {
      //       "user_fav_color": favColor,
      //       "dist": dist,
      //       "origin": origin,
      //       "min_age": minAge,
      //       "max_age": maxAge
      //     }
      //   };
      
      // const results =[];
      
      // for (let user of filteredUsers) {
      //   const { user_id, user_name, user_age, user_fav_color } = user;

      //   user["locationHistory"] =  {
      //     "type": "FeatureCollection",
      //     "features":
      //     [
      //       {
      //         "type": "Feature",
      //         "properties": {
      //           "city": user.last_location
      //         },
      //         "geometry": {
      //           "type": "Point",
      //           "coordinates": [user.lat, user.long]
      //         }
      //       }
      //     ]
      //   }

      //   results.push(
      //     {"type": "user",
      //     "locationHistory": user.locationHistory,
      //     "properties":
      //       {
      //         "id": user_id,
      //         "name": user_name, 
      //         "age": user_age,
      //         "fav_color": user_fav_color
      //       }
      //     });
      //   }   
        
      

      // return res.json({
      //     "metadata": metadata,
      //     "num_results": results.length,
      //     "results": results
      //   });

  }
  catch (err) {
      return next(err);
  }
});

module.exports = router;





// router.get("/users", async function (req, res, next) {
//     try {
//         const { favColor, minAge, maxAge, dist, origin } = req.query;

//         const result = await db.query(
//           'SELECT user_id, user_name, user_age, user_fav_color, last_location, lat, long FROM users');

//         const users = result.rows;      

//         // if querying by color, apply filter to results; otherwise, results remain the same
//         let filteredByColor;
//         if (favColor) { 
//           filteredByColor = users.filter(user => user.user_fav_color === favColor);
//         }
//         else {
//           filteredByColor = users;
//         }

//         // if querying by minimum age, apply filter to previous results; otherwise, results remain the same
//         let filteredByMinAge
//         if (minAge) {
//           filteredByMinAge = filteredByColor.filter(user => user.user_age >= minAge);
//         }
//         else {
//           filteredByMinAge = filteredByColor;
//         }
        
//         // if querying by maximum age, apply filter to previous results; otherwise, results remain the same
//         let filteredByMaxAge;
//         if (maxAge) {
//           filteredByMaxAge = filteredByMinAge.filter(user => user.user_age <= maxAge);
//         }
//         else {
//           filteredByMaxAge = filteredByMinAge;
//         }
//         // console.log(filteredByMaxAge)
        
//         let filteredUsers =[];        
//           for (let user of filteredByMaxAge) {     
//             if (origin && dist) {
//             const a = [user.lat, user.long];
//             const b = origin.split(',');
//             // use haversine formula to calculate distance between two points using lat/long coordinates
//             const distInMeters = (haversine(a,b)); 
//             const distInMiles = Math.ceil(distInMeters/metersPerMile);  
//             user["distanceFromOrigin"] = distInMiles;
//             filteredUsers = filteredByMaxAge.filter(user => user.distanceFromOrigin <= dist);
//           } 
//           else {
//             filteredUsers = filteredByMaxAge;
//           }    
//         }

//         const metadata = {
//             "path": "/users",
//             "query": {
//               "user_fav_color": favColor,
//               "dist": dist,
//               "origin": origin,
//               "min_age": minAge,
//               "max_age": maxAge
//             }
//           };
        
//         const results =[];
        
//         for (let user of filteredUsers) {
//           const { user_id, user_name, user_age, user_fav_color } = user;

//           user["locationHistory"] =  {
//             "type": "FeatureCollection",
//             "features":
//             [
//               {
//                 "type": "Feature",
//                 "properties": {
//                   "city": user.last_location
//                 },
//                 "geometry": {
//                   "type": "Point",
//                   "coordinates": [user.lat, user.long]
//                 }
//               }
//             ]
//           }

//           results.push(
//             {"type": "user",
//             "locationHistory": user.locationHistory,
//             "properties":
//               {
//                 "id": user_id,
//                 "name": user_name, 
//                 "age": user_age,
//                 "fav_color": user_fav_color
//               }
//             });
//           }   
          
        

//         return res.json({
//             "metadata": metadata,
//             "num_results": results.length,
//             "results": results
//           });

//     }
//     catch (err) {
//         return next(err);
//     }
// });

// module.exports = router;