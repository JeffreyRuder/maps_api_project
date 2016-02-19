var INITIAL_QUERY_RADIUS = '1000';

var Query = function(searchSession) {
  this.placeMarkers = [];
  this.searchSession = searchSession;
  this.openNowFlag = true;
  this.radiusFlag = INITIAL_QUERY_RADIUS;
  this.hippieFlag = false;
  this.hipsterFlag = false;
  this.pickyFlag = false;
  this.keywords = [];
  this.customKeywords = [];
};

Query.prototype.getQueryResults = function() {
  this.request = {
    location: this.searchSession.currentCenter,
    radius: this.radiusFlag,
    type: ['restaurant'],
    keyword: [],
    //Using both cases because documentation is ambiguous
    //This returns places without specified opening hours if set to true, contrary to Places API documentation
    openNow: this.openNowFlag,
    opennow: this.openNowFlag
  };

  var currentQuery = this;
  this.request.keyword = this.generateSearchKeywords().join(" ");
  service = new google.maps.places.PlacesService(this.searchSession.map);
  service.radarSearch(this.request, function(results, status) {
    currentQuery.randomDestination = currentQuery.pickRandomResultAndGenerateURL(results, status);
    return currentQuery.createMarkersForPlaceResults(results, status);
  });

  this.clearAllMarkers();
};

Query.prototype.createMarkersForPlaceResults = function(results, status) {
  var currentQuery = this;
  currentQuery.infoWindows = [];
  console.log(status);
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      currentQuery.createMarker(results[i]);
    }
  }

  google.maps.event.addListener(currentQuery.searchSession.map, "click", function(event) {
    currentQuery.clearAllInfoWindows();
  });
};

Query.prototype.pickRandomResultAndGenerateURL = function(results, status) {
  var currentQuery = this;

  if (status == google.maps.places.PlacesServiceStatus.OK) {
    var randomNumber = Math.floor(Math.random() * (results.length));
    var randomResult = results[randomNumber];
    var randomResultLocation = randomResult.geometry.location;
    service.getDetails(randomResult, function(result, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
      }
      currentQuery.randomDestination = currentQuery.generateDestinationURL(randomResultLocation, result)
    });

  }
};

Query.prototype.clearAllMarkers = function() {
  for (var i = 0; i < this.placeMarkers.length; i++) {
    this.placeMarkers[i].setMap(null);
  }
  this.placeMarkers = [];
};

Query.prototype.clearAllInfoWindows = function() {
  this.infoWindows.forEach(function(infoWindow) {
    infoWindow.close();
  });
};

Query.prototype.createMarker = function(place, infoWindows) {
  var currentQuery = this;
  var placeLoc = place.geometry.location;
  var placeMarker = new google.maps.Marker({
    map: currentQuery.searchSession.map,
    position: place.geometry.location
  });
  currentQuery.placeMarkers.push(placeMarker);

  google.maps.event.addListener(placeMarker, 'click', function() {
    currentQuery.clearAllInfoWindows();
    console.log('service:' + service)
    service.getDetails(place, function(result, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
      }
      // https://www.google.com/maps/dir/startLat,startLng/DestName,DestAddr/DestLat,DestLng/
      var directionsURL = currentQuery.generateDestinationURL(placeLoc, result)
      var contentString = '<h5>' + result.name + '</h5><p><a href="' + directionsURL + '" target="_blank">Go Here</a></p>';
      var infoWindow = new google.maps.InfoWindow({map: currentQuery.searchSession.map});
      currentQuery.infoWindows.push(infoWindow);
      infoWindow.setContent(contentString);
      infoWindow.open(currentQuery.searchSession.map, placeMarker);
    });
  });
};

Query.prototype.generateDestinationURL = function (destinationLocation, destinationObject) {
  var directionsURL = 'https://www.google.com/maps/dir/' +
    this.searchSession.map.getCenter().lat() + ',' +
    this.searchSession.map.getCenter().lng() + '/' +
    destinationObject.name + ',' + destinationObject.formatted_address + '/@' +
    destinationLocation.lat() + ',' + destinationLocation.lng();
  return directionsURL;
};

Query.prototype.generateSearchKeywords = function() {
  this.keywords = [];

  if (this.hippieFlag) {
    this.keywords.push('vegetarian');
  }

  if (this.hipsterFlag) {
    this.keywords.push('-applebees');
  }

  if (this.pickyFlag) {
    this.keywords.push('american OR italian');
  }
  this.keywords = this.keywords.concat(this.customKeywords);
  return this.keywords;
};

Query.prototype.addCustomKeywords = function (input) {
  this.customKeywords = [];
  var customKeywords = this.customKeywords;
  words = input.split(/[,\s]+/g);
  words.forEach(function(word) {
    customKeywords.push(word);
  });
  this.getQueryResults();
};

Query.prototype.removeIndexFromKeywords = function (index) {
  var index = parseInt(index);
  var keyword = this.keywords[index];

  var customIndex = this.customKeywords.indexOf(keyword);
  if (customIndex > -1) this.customKeywords.splice(customIndex, 1);
  if (index > -1) this.keywords.splice(index, 1);
  this.toggleRelatedFlags(keyword);
  this.getQueryResults();
};

Query.prototype.toggleRelatedFlags = function(keyword) {
  switch (keyword) {
    case "vegetarian":
      this.hippieFlag = false;
      break;
    case "-applebees":
      this.hipsterFlag = false;
      break;
    case "american OR italian":
      this.pickyFlag = false;
      break;
    default:
      break;
  }
};

Query.prototype.toggleOpenNow = function () {
  this.openNowFlag = !this.openNowFlag;
  this.getQueryResults();
};

Query.prototype.toggleHippie = function () {
  this.hippieFlag = !this.hippieFlag;
  this.getQueryResults();
};

Query.prototype.toggleHipster = function () {
  this.hipsterFlag = !this.hipsterFlag;
  this.getQueryResults();
};

Query.prototype.togglePicky = function () {
  this.pickyFlag = !this.pickyFlag;
  this.getQueryResults();
};

Query.prototype.setRadius = function (radius) {
  this.radiusFlag = radius;
  this.getQueryResults();
};

module.exports = Query;
