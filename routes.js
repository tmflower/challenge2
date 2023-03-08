const express = require("express");
const router = express.Router();
const db = require("./db");
const haversine = require('haversine-distance');

const metersPerMile = 1609.334;

router.get("/users", async function (req, res, next) {
  try {
      const { favColor, minAge, maxAge, dist, origin } = req.query;

      // get all the users first
      const usersResult = await db.query(
        'SELECT user_id, user_name, user_age, user_fav_color FROM users');

      let users = usersResult.rows;    
           
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
      
      users = filteredByMaxAge;

      // get lat and long coordinates from db for all locations
      const coordsResult = await db.query('SELECT last_location, lat, long FROM locations');
      const locationData = coordsResult.rows;
      
      // filter locations to return only those within range of chosen distance
      let validLocations;

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
        validCities = locationsInRange.map(location => location.last_location); 
      }
      // ensure all location data is provided if no location query is made
      else validCities = locationData.map(data => data.last_location);    

      // query db to associate users with locations
      const citiesResult = await db.query('SELECT user_name, last_location FROM users_locations');

      // add location names to each user
      for (let user of users) {
        user['cities'] = []; 
        for (let city of citiesResult.rows) { 
          if ((user.user_name === city.user_name) && (validCities.includes(city.last_location))) {
            user['cities'] = [city.last_location,  ...user.cities]
          }
        } 
      }

      // make location data easier to associate with users
      const allLocations = [];
      for (let location of locationData) {
        let locationInfo = {
          'city': location.last_location,
          'lat': location.lat,
          'long': location.long
        }
        allLocations.push(locationInfo)
      }
      
      // add full location data to each user
      for (let user of users) {
        user['locations'] = [];
        for (let location of allLocations) { 
          if (user.cities.includes(location.city)) { 
            user['locations'] = [location, ...user.locations]
          }
        }
      }

      // generate JSON data to return 
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
      
    const results = [];

    for (let user of users) {
      const userFeatures = [];
      for (let location of user.locations) {
        const userFeature = {
          "type": "Feature",
          "properties": {
            "city": location.city
          },
          "geometry": {
            "type": "Point",
            "coordinates": [location.lat, location.long]
          }
        }
        userFeatures.push(userFeature)
      }

      const userResult = {
        "type": "user",
        "locationHistory": {
          "type": "FeatureCollection",
          "features": userFeatures
        },
        "properties": {
          "id": user.user_id,
          "name": user.user_name,
          "age": user.user_age,
          "fav_color": user.user_fav_color
        }
      }
      if (user.locations.length) {
        results.push(userResult)
      }      
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