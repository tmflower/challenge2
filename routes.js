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

      let locationData=[];
      for (let location of locationNames) {         
        let result = await db.query(`
        SELECT last_location, lat, long FROM locations WHERE last_location = $1`, [location]); 
        for (let row of result.rows) {
          locationData.push(row)
        }
      }

      // filter locations to return only those within range of chosen distance
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

// console.log("IN RANGE", locationsInRange)

      // associate filtered locations with users
      const validLocations = locationsInRange.map(location => location.last_location);
    
      userLocations = userLocations.filter(userLocation => validLocations.includes(userLocation.last_location));
      // console.log("USER LOCATIONS", userLocations)

      const validNames = userLocations.map(location => location.user_name);

      // console.log("VALID Names", validNames)

      users = filteredByMaxAge.filter(user => validNames.includes(user.user_name));
      // console.log(users)

      const cities = [];
      let newLocation;
      for (let user of users) { 
        for (let userLocation of userLocations) { 
          if (userLocation.last_location !== null) { 
            // console.log("LOCATION DATA", locationData)
              newLocation = {
                "city": userLocation.last_location
              }
              cities.push(newLocation)
            }
        }
        user["cities"] = cities
      }
      console.log("CITIES", cities)
    
      const coords = [];
      let newCoords;
      for (let user of users) {
        for (let data of locationData) {
          // console.log("THIS", user.cities[0].city, data.last_location)
          if (user.cities[0].city === data.last_location) {     
            // console.log("THIS", data);
               
            // newCoords = {
            //   "lat": data.lat,
            //   "long": data.long
            // }
            // coords.push(newCoords); console.log("COORDS", coords)
          }
        }
        user["coords"] = coords
      }

      for (let user of users) {
        // console.log("USER CITIES", user.cities)
        // console.log("USER COORDS", user.coords)
        console.log("LOCATION DATA", locationData)
      }
        // if (userLocations.includes)
        // user["locationHistory"] = {
        //   "type": "FeatureCollection",
        //   "features":
        //   [
        //     {
        //       "type": "Feature",
        //       "properties": {
        //         "city": "Kona"
        //       },
        //       "geometry": {
        //         "type": "Point",
        //         "coordinates": [userLocations.lat, userLocations.long]
        //       }
        //     }
        //   ]
        // }
      

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