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
        'SELECT user_id, user_name, user_age, user_fav_color FROM users');

      let users = result.rows;      
      
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

      // For users that meet all query terms, get locations from db
      let userLocations=[];
      let locationData=[];
      // if (dist && origin) {

      const names = filteredByMaxAge.map(user => user.user_name);
      for (let name of names) {
        let result = await db.query(`
        SELECT user_name, last_location FROM users_locations WHERE user_name = $1`, [name]);
        for (let row of result.rows) {
          userLocations.push(row)
        }
      }
      
      // Using locations, get lat and long for each from db
      let locationNames=[];
      for (let location of userLocations) {
        locationNames.push(location.last_location);
      }
      
      
      for (let location of locationNames) {         
        let result = await db.query(`
        SELECT last_location, lat, long FROM locations WHERE last_location = $1`, [location]); 
        for (let row of result.rows) {
          locationData.push(row)
        }
      }
      
      // filter locations to return only those within range of chosen distance
      if (origin && dist) {
      let locationsInRange =[];        
        for (let coords of locationData) { 
          if (origin && dist) { 
          const a = [coords.lat, coords.long];
          const b = origin.split(',');
      // use haversine formula to calculate distance between two points using lat/long coordinates
          const distInMeters = (haversine(a,b)); 
          const distInMiles = Math.ceil(distInMeters/metersPerMile); 
          if (distInMiles <= dist) { 
            locationsInRange.push(coords);
          }
        }
      }
      // console.log("LOCATIONS IN RANGE",locationsInRange)

      // associate filtered locations with users
      const validLocations = locationsInRange.map(location => location.last_location);
   
      userLocations = userLocations.filter(userLocation => validLocations.includes(userLocation.last_location));

      const validNames = userLocations.map(location => location.user_name);

      users = filteredByMaxAge.filter(user => validNames.includes(user.user_name));
    }

    else users = filteredByMaxAge;

    const cities = [];
    let newLocation;
      
    if (userLocations.length) {
      // console.log(userLocations, "*****************")
      for (let user of users) { 
        for (let userLocation of userLocations) { 
          // console.log(userLocation)
          if (userLocation.last_location !== null) { 
              newLocation = {
                "city": userLocation.last_location
              }
              cities.push(newLocation)
            }
        }
        user["cities"] = cities;
        // console.log(user.cities, "*****************")
      } 
    }

    let filteredUserLocations = [];
    let features = [];
    for (let user of users) { 
      // console.log(user, "@@@@@@@@@@@@@@@")
      if (user.cities.length) {
        for (let city of user.cities) {          
          let userLocation = locationData.filter(data => data.last_location === city.city);
          filteredUserLocations.push(userLocation);
          // console.log("############DATA", city)
        // } console.log(filteredUserLocations, 'LOCATIONS*********')
    }
      for (let location of filteredUserLocations) { 
        // console.log(location, "----------------------------", "filtered", filteredUserLocations)
        features.push(
          {
            "type": "Feature",
            "properties": {
              "city": location[0].last_location
            },
            "geometry": {
              "type": "Point",
              "coordinates": [location[0].lat, location[0].long]
            }
          }
        )
      }

      user["locationHistory"] = {
        "type": "FeatureCollection",
        "features": features
      } 
    } 
  }   
      const metadata = {
          "path": "/users",
          "query": {
            "user_fav_color": favColor,
            "dist": dist,
            "origin": origin,
            "min_age": minAge,
            "max_age": maxAge
          }
        };
      
      const results =[];
      
      for (let user of users) { 
        console.log(user, "============")
        const { user_id, user_name, user_age, user_fav_color } = user;

        results.push(
          {"type": "user",
          "locationHistory": user.locationHistory,
          "properties":
            {
              "id": user_id,
              "name": user_name, 
              "age": user_age,
              "fav_color": user_fav_color
            }
          });
        } 
        // console.log(results, "+++++++++++++++++++++++++")  
        
      return res.json({
          "metadata": metadata,
          "num_results": results.length,
          "results": results
        });
  }

  catch (err) {
      return next(err);
  }
});

module.exports = router;



// Original attempt; works except returns duplicates if same user has multiple locations

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