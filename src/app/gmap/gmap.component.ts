import { Component, OnInit, AfterViewChecked } from "@angular/core";
import { Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import * as geolib from "geolib";
import { HttpClient } from "@angular/common/http";

declare const google: any;
// declare const geolib: any;

@Component({
  selector: "app-gmap",
  templateUrl: "./gmap.component.html",
  styleUrls: ["./gmap.component.scss"]
})
export class GmapComponent implements OnInit, AfterViewChecked {
  ngAfterViewChecked(): void {
    this.allowOnlyCircleAndPolygon();
  }
  geocodeURL = "https://maps.googleapis.com/maps/api/geocode/json";
  drawingManager: any;
  selectedShape: any;
  colors = ["#1E90FF", "#FF1493", "#32CD32", "#FF8C00", "#4B0082"];
  selectedColor: any;
  colorButtons = {};
  document: any;
  map: any;
  name: any;
  zoneObject: {} = {};
  currentShapeLatLng: {} = {}; // to store teh current shape object;
  delCharge: any = 0;
  checkDeliveryCharge: any = 0;
  checkLat: any = 0;
  checkLng: any = 0;

  listOfZoneShapes: any[] = [];

  isbeingDragged: boolean = false;
  currentShape: any;

  currentShapes = {
    // to store the created shapes coordinates
    marker: [],
    polyline: [],
    rectangle: [],
    circle: [],
    polygon: []
  };

  pathBeforeChange: any;
  zoneObjectArray: any = [];

  clickLat: any = 0;
  clickLng: any = 0;
  address: any;
  addressMarker: any;
  addressRestMarker: any;

  // types of shapes constructed
  // marker
  // polyline
  // rectangle
  // circle
  // polygon

  constructor(@Inject(DOCUMENT) document, public http: HttpClient) {
    this.document = document;
  }

  allowOnlyCircleAndPolygon() {
    let drawingNode = null;
    let mapArr = document.getElementsByClassName("gmnoprint");
    for (let i = 0; i < mapArr.length; i++) {
      if(mapArr[i].childElementCount == 6){
        drawingNode = mapArr[i].children;
      }
    }
    if(drawingNode){
      [1, 2, 3].forEach(index => {
        if (drawingNode[index]) {
          drawingNode[index].style.display = "none";
        }
      });
    }
    // if (document.getElementsByClassName("gmnoprint")[2]) {
    //   console.log("inside allowonly2");
    //   let map1 = this.document.getElementById("map");
    //   let AlldrawToolsNode: any = document.getElementsByClassName(
    //     "gmnoprint"
    //   )[2].children;
    //   [1, 2, 3].forEach(index => {
    //     if (AlldrawToolsNode[index]) {
    //       AlldrawToolsNode[index].style.display = "none";
    //     }
    //   });
    // }
  }

  updateShapesCoords(newShape) {
    let newpath = this.getPaths(newShape);
    if (newShape.type == "polygon") {
      this.currentShapes.polygon.forEach((element, i) => {
        if (JSON.stringify(this.pathBeforeChange) === JSON.stringify(element)) {
          this.currentShapes.polygon[i] = newpath;
        }
      });
    } else if (newShape.type == "circle") {
      this.currentShapes.circle.forEach((element, i) => {
        if (JSON.stringify(this.pathBeforeChange) === JSON.stringify(element)) {
          // console.log('changed');
          this.currentShapes.circle[i] = newpath;
        }
      });
    }
    // console.log(this.currentShapes);
  }

  clearSelection() {
    if (this.selectedShape) {
      if (this.selectedShape.type !== "marker") {
        this.selectedShape.setEditable(false);
      }

      this.selectedShape = null;
    }
  }

  setSelection(shape) {
    if (shape.type !== "marker") {
      this.clearSelection();
      // shape.setEditable(true);
      this.selectColor(shape.get("fillColor") || shape.get("strokeColor"));
    }
    this.selectedShape = shape;
    this.pathBeforeChange = this.getPaths(shape);
    // console.log("shape selected");
    // console.log(shape);
  }

  deleteSelectedShape() {
    // console.log("deleting the element");
    // console.log(this.selectedShape);
    // done
    console.log(this.currentShape);
    this.currentShapes.polygon.forEach((element, i) => {
      if (
        JSON.stringify(this.getPaths(this.selectedShape)) ===
        JSON.stringify(element)
      ) {
        this.currentShapes.polygon.splice(i, 1);
      }
    });
    this.selectedShape.setMap(null);
    this.showDrawingTools();
  }

  selectColor(color) {
    this.selectedColor = color;
    for (var i = 0; i < this.colors.length; ++i) {
      var currColor = this.colors[i];
      this.colorButtons[currColor].style.border =
        currColor == color ? "2px solid #789" : "2px solid #fff";
    }
    // Retrieves the current options from the drawing manager and replaces the
    // stroke or fill color as appropriate.
    // var polylineOptions = this.drawingManager.get("polylineOptions");
    // polylineOptions.strokeColor = color;
    // this.drawingManager.set("polylineOptions", polylineOptions);
    // var rectangleOptions = this.drawingManager.get("rectangleOptions");
    // rectangleOptions.fillColor = color;
    // this.drawingManager.set("rectangleOptions", rectangleOptions);
    var circleOptions = this.drawingManager.get("circleOptions");
    circleOptions.fillColor = color;
    this.drawingManager.set("circleOptions", circleOptions);
    var polygonOptions = this.drawingManager.get("polygonOptions");
    polygonOptions.fillColor = color;
    this.drawingManager.set("polygonOptions", polygonOptions);
  }

  setSelectedShapeColor(color) {
    if (this.selectedShape) {
      if (this.selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
        this.selectedShape.set("strokeColor", color);
      } else {
        this.selectedShape.set("fillColor", color);
      }
    }
  }

  makeColorButton(color) {
    var button = this.document.createElement("span");
    button.className = "color_button";
    button.style.backgroundColor = color;
    button.style.width = "14px";
    button.style.height = "14px";
    button.style.margin = "2px";
    button.style.float = "left";
    button.style.cursor = "pointer";
    google.maps.event.addDomListener(button, "click", () => {
      this.selectColor(color);
      this.setSelectedShapeColor(color);
    });
    return button;
  }

  buildColorPalette() {
    var colorPalette = this.document.getElementById("color-palette");
    for (var i = 0; i < this.colors.length; ++i) {
      var currColor = this.colors[i];
      var colorButton = this.makeColorButton(currColor);
      colorPalette.appendChild(colorButton);
      this.colorButtons[currColor] = colorButton;
    }
    this.selectColor(this.colors[0]);
  }

  getPaths(newshape) {
    if (newshape.type == "polygon") {
      let paths = [];
      // console.log("get path");
      if (newshape) {
        const vertices = newshape.getPaths().getArray()[0];
        vertices.getArray().forEach(function(xy, i) {
          let latLng = {
            latitude: xy.lat(),
            longitude: xy.lng()
          };
          paths.push(latLng);
        });
        // console.log(paths);
        return paths;
      }
      return [];
    } else if (newshape.type == "circle") {
      if (newshape) {
        let path = {
          latitude: newshape.getCenter().lat(),
          longitude: newshape.getCenter().lng(),
          radius: newshape.getRadius()
        };
        return path;
      } else {
        return {};
      }
      // console.log(path);
    }
  }

  displayCoordinates(pnt) {
    this.clickLat = pnt.lat();
    // lat = lat.toFixed(4);
    this.clickLng = pnt.lng();
    // lng = lng.toFixed(4);
    console.log("Latitude: " + this.clickLat + "  Longitude: " + this.clickLng);
  }

  findCurrentLocation() {
    var infoWindow = new google.maps.InfoWindow({ map: this.map });
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position)=> {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log(pos);
          console.log("position found");
          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          this.map.setCenter(pos);
        },
        ()=> {
          // this.handleLocationError(true, infoWindow, this.map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      // this.handleLocationError(false, infoWindow, this.map.getCenter());
    }
  }

  handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation."
    );
  }

  placeMarkerForRestaurant(){
    var latlng = new google.maps.LatLng(
      37.3945646,
      -122.0787532
    );
    this.addressRestMarker = new google.maps.Marker({
      map: this.map,
      position: latlng,
      draggable: false,
      anchorPoint: new google.maps.Point(0, 0)
    });
  }

  initialize() {
    var map = new google.maps.Map(this.document.getElementById("map"), {
      zoom: 16,
      center: new google.maps.LatLng(37.3945646, -122.0787532),
      mapTypeId: google.maps.MapTypeId.HYBRID,
      disableDefaultUI: true,
      zoomControl: true
    });
    this.map = map;
    var polyOptions = {
      strokeWeight: 0,
      fillOpacity: 0.45,
      clickable: true,
      editable: true,
      draggable: true
    };
    this.findCurrentLocation();
    this.placeMarkerForRestaurant();

    // Creates a drawing manager attached to the map that allows the user to draw
    // markers, lines, and shapes.
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      markerOptions: {
        draggable: true
      },
      // polylineOptions: {
      //   editable: true,
      //   draggable: true
      // },
      // rectangleOptions: polyOptions,
      circleOptions: polyOptions,
      polygonOptions: polyOptions,
      map: map
    });
    google.maps.event.addListener(map, "click", event => {
      this.displayCoordinates(event.latLng);
    });
    google.maps.event.addListener(
      this.drawingManager,
      "drawingmode_changed",
      () => {
        // when the icons in drawing tools are clicked
        this.hideAllShapes();
        // console.log("drawing mode changed:");
      }
    );
    google.maps.event.addListener(this.drawingManager, "overlaycomplete", e => {
      this.hideDrawingTools();
      this.currentShapeLatLng = {};
      // console.log("overlay complete :", e.type);
      var newShape = e.overlay;
      newShape.type = e.type;
      this.currentShape = newShape;
      if (newShape.type == "polygon") {
        this.currentShapes.polygon.push(this.getPaths(newShape));
        this.currentShapeLatLng["polygon"] = this.getPaths(newShape);
        // console.log(newShape);
        var paths = this.getPaths(newShape);
        // paths.forEach(function(path, i) {
        google.maps.event.addListener(newShape.getPath(), "insert_at", () => {
          console.log("insert-at", newShape.type);
          console.log("path after change(vertex extend)::", newShape.type);
          console.log(this.getPaths(newShape));
          this.currentShape = newShape;
          this.updateShapesCoords(newShape);
          // triggerCoordinatesChanged();
        });
        google.maps.event.addListener(newShape.getPath(), "set_at", () => {
          if (!this.isbeingDragged) {
            console.log("set-at", newShape.type);
            console.log("path after change(vertex extend)::", newShape.type);
            console.log(this.getPaths(newShape));
            this.currentShape = newShape;
            this.updateShapesCoords(newShape);
          }
        });
        google.maps.event.addListener(newShape.getPath(), "remove_at", () => {
          console.log("remove-at", newShape.type);
          this.currentShape = newShape;
          this.getPaths(newShape);
        });
        // });
      }
      if (newShape.type == "circle") {
        this.currentShapes.circle.push(this.getPaths(newShape));
        this.currentShapeLatLng["circle"] = this.getPaths(newShape);
        google.maps.event.addListener(newShape, "radius_changed", () => {
          console.log("radius_changed-at", newShape.type);
          this.currentShape = newShape;
          // console.log("path after change(vertex extend)::", newShape.type);
          // console.log(this.getPaths(newShape));
          this.updateShapesCoords(newShape);
          // triggerCoordinatesChanged();
        });
        google.maps.event.addListener(newShape, "click", e => {
          // console.log("clicked");
          // this.setSelection(newShape); // it should select the shape when clicked on the shape
        });
      }
      // if (newShape.type == "rectangle") {
      //   let path = {

      //   }
      //   var bounds = newShape.getBounds();
      //   console.log(bounds.getNorthEast());
      //   console.log(bounds.getSouthWest());
      // }
      google.maps.event.addListener(newShape, "dragstart", () => {
        this.isbeingDragged = true;
        console.log("dragStart", newShape.type);
        console.log("path before change(drag)::", newShape.type);
        console.log(this.getPaths(newShape));
      });
      google.maps.event.addListener(newShape, "dragend", () => {
        console.log("dragEnd", newShape.type);
        console.log("path after change(drag)::", newShape.type);
        console.log(this.getPaths(newShape));
        this.updateShapesCoords(newShape);
        this.isbeingDragged = false;
      });
      console.log(this.currentShapes);
      if (e.type !== google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        this.drawingManager.setDrawingMode(null);
        // google.maps.event.addListener(newShape, "mousedown", e => {
        //   console.log("mousedown");
        //   console.log(e);
        //   // clicking on the shapes
        //   // if (e.vertex !== undefined || e.edge !== undefined) {
        //   //   // if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
        //   //     // for polygon
        //   //     // console.log(this.getPaths(newShape));
        //   //     this.pathBeforeChange = this.getPaths(newShape);
        //   //     console.log("path before change::");
        //   //     console.log(this.pathBeforeChange);
        //   //   // }
        //   // }
        // });
        // google.maps.event.addListener(newShape, "mouseup", e => {
        //   console.log("mouseup");
        //   this.setSelection(newShape); // it should select the shape when clicked on the shape
        // });
        google.maps.event.addListener(newShape, "click", e => {
          console.log("clicked");
          this.setSelection(newShape); // it should select the shape when clicked on the shape
        });
        this.setSelection(newShape);
      } else {
        this.setSelection(newShape);
      }
    });
    // Clear the current selection when the drawing mode is changed, or when the
    // map is clicked.
    google.maps.event.addListener(
      this.drawingManager,
      "drawingmode_changed",
      this.clearSelection.bind(this)
    );
    google.maps.event.addListener(map, "click", this.clearSelection.bind(this));
    google.maps.event.addDomListener(
      this.document.getElementById("delete-button"),
      "click",
      this.deleteSelectedShape.bind(this)
    );
    this.buildColorPalette();
  }

  addZone() {
    if(!this.selectedShape){
      alert('Please draw the shape');
      return;
    }
    let obj = {};
    obj["name"] = this.name;
    obj["shape"] = this.currentShapeLatLng;
    obj["deliveryCharge"] = this.delCharge;
    this.zoneObjectArray.push(obj);
    this.zoneObject[this.name] = this.currentShapeLatLng;
    console.log(this.currentShape);
    this.currentShape.editable = false;
    this.currentShape.draggable = false;
    // this.currentShape.clickable = false;

    this.listOfZoneShapes.push({ name: this.name, shape: this.currentShape });
    this.hideAllShapes();
    // this.showAllShapes();
    this.showDrawingTools();
    this.name = "";
    this.delCharge = 0;
    console.log('zoneObjectARR', this.zoneObjectArray);
    console.log('listofZoneShapes',this.listOfZoneShapes);
  }

  editEnable(name) {
    this.hideAllShapes();
    this.showShape(name);
    console.log('name of zone', name);
    console.log('listofZoneShapes',this.listOfZoneShapes);
    this.listOfZoneShapes.forEach(element => {
      if (element.name == name) {
        element.shape.setEditable(true);
        element.shape.draggable = true;
        // this.setSelection(element.shape);
        // element.shape.clickable = true;
        // this.selectedShape.setEditable(true);
        // this.selectedShape.draggable = true;
        // this.currentShape.clickable = true;
        console.log(this.getPaths(element.shape));
      }
    });
  }
  isBeingEdited(name) {
    let flag = false;
    this.listOfZoneShapes.forEach(element => {
      if (element.name == name && element.shape.editable == true) {
        flag = true;
      }
    });
    return flag;
  }

  deleteZone(name){
    let delIndex1 = 0;
    let delIndex2 = 0;
    this.listOfZoneShapes.forEach((element, i) => {
      if (element.name == name) {
        delIndex1 = i;
      }
    });
    this.zoneObjectArray.forEach((element, i) => {
      if (element.name == name) {
        delIndex2 = i;
      }
    });
    this.listOfZoneShapes.splice(delIndex1,1);
    this.zoneObjectArray.splice(delIndex2,1);
  }

  saveShape(name) {
    this.listOfZoneShapes.forEach((element, i) => {
      if (element.name == name) {
        this.listOfZoneShapes[i] = {
          name: name,
          shape: this.currentShape
        };
        element.shape.setEditable(false);
        element.shape.draggable = false;
        this.hideAllShapes();
        console.log(this.getPaths(this.currentShape));
        // element.shape.clickable = false;
      }
    });
    // this.currentShape = null;
  }

  showShape(name) {
    this.listOfZoneShapes.forEach((element, i) => {
      if (element.name == name) {
        this.currentShape = element.shape;
        element.shape.setMap(this.map);
      }
    });
  }

  showAllShapes() {
    this.listOfZoneShapes.forEach(element => {
      element.shape.setMap(this.map);
    });
  }

  hideAllShapes() {
    this.listOfZoneShapes.forEach(element => {
      element.shape.setMap(null);
    });
  }

  showDrawingTools() {
    this.drawingManager.setMap(this.map);
  }

  hideDrawingTools() {
    this.drawingManager.setMap(null);
  }

  getDilveryCharge(coordObj) {
    let delCharge = 0;
    console.log('zoneobjectarr', this.zoneObjectArray);
    this.zoneObjectArray.forEach(item => {
      if (item.shape.polygon) {
        if (geolib.isPointInside(coordObj, item.shape.polygon)) {
          if (delCharge == 0 || item.deliveryCharge < delCharge) {
            delCharge = item.deliveryCharge;
          }
        }
      } else if (item.shape.circle) {
        console.log("is inside circle");
        let check = {
          latitude: item.shape.circle.latitude,
          longitude: item.shape.circle.longitude
        };
        console.log(coordObj);
        console.log(check);
        console.log(item.shape.circle.radius);
        console.log("is inside circle");
        if (geolib.isPointInCircle(coordObj, check, item.shape.circle.radius)) {
          console.log("is inside circle");
          if (delCharge == 0 || item.deliveryCharge < delCharge) {
            delCharge = item.deliveryCharge;
          }
        }
      }
    });
    return delCharge;
  }

  checkDelivery(addresFlag) {
    let checkObj = { latitude: 0, longitude: 0 };
    if (addresFlag) {
      this.http
        .get(
          `${this.geocodeURL}?address=${
            this.address
          }&key=AIzaSyC9PnuRk42kbCPMOvsfHpn40r5SoyN38zI`
        )
        .subscribe((data: any) => {
          if (data.results[0]) {
            if (this.addressMarker) {
              this.addressMarker.setMap(null);
            }
            checkObj.latitude = data.results[0].geometry.location.lat;
            checkObj.longitude = data.results[0].geometry.location.lng;
            this.clickLat = checkObj.latitude;
            this.clickLng = checkObj.longitude;
            var latlng = new google.maps.LatLng(
              checkObj.latitude,
              checkObj.longitude
            );
            this.addressMarker = new google.maps.Marker({
              map: this.map,
              position: latlng,
              draggable: false,
              anchorPoint: new google.maps.Point(0, 0)
            });
            this.checkDeliveryCharge = this.getDilveryCharge(checkObj);
            console.log(data);
          }
        });
    } else {
      checkObj.latitude = this.clickLat;
      checkObj.longitude = this.clickLng;
      this.checkDeliveryCharge = this.getDilveryCharge(checkObj);
    }
  }

  ngOnInit() {
    this.initialize();
    
  }
}
