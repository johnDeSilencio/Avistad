import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import styled from 'styled-components';
import AutoComplete from './Autocomplete';
import Marker from './Marker';
import Button from './Button';

const Wrapper = styled.main`
    width: 100%;
    height: 100%;
`;

class MyGoogleMap extends Component {
    state = {
        mapApiLoaded: false,
        mapInstance: null,
        mapApi: null,
        geoCoder: null,
        places: [],
        center: [],
        zoom: 9,
        address: '',
        draggable: true,
        lat: null,
        lng: null,
        url: '',
        startingLocations: [],
        destinationLocations: []
    };

    componentWillMount() {
        this.setCurrentLocation();
    }

    onMarkerInteraction = (childKey, childProps, mouse) => {
        this.setState({
            draggable: false,
            lat: mouse.lat,
            lng: mouse.lng
        });
    }

    onMarkerInteractionMouseUp = (childKey, childProps, mouse) => {
        this.setState({ draggable: true });
        this._generateAddress();
    }

    _onChange = ({ center, zoom }) => {
        this.setState({
            center: center,
            zoom: zoom
        });
    }

    _onClick = (value) => {
        this.setState({
            lat: value.lat,
            lng: value.lng
        });
    }

    apiHasLoaded = (map, maps) => {
        this.setState({
            mapApiLoaded: true,
            mapInstance: map,
            mapApi: maps
        });

        this._generateAddress();
    };

    addPlace = (place) => {
        this.setState({
            places: [place],
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        });

        this._generateAddress();
    };

    _generateAddress() {
        const {
            mapApi
        } = this.state;

        const geocoder = new mapApi.Geocoder;

        geocoder.geocode({ 'location': { lat: this.state.lat, lng: this.state.lng } }, (results, status) => {
            if (status === 'OK') {
                if (results[0]) {
                    this.zoom = 12;
                    this.setState({ address: results[0].formatted_address });
                } else {
                    window.alert('That address could not be found.');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });
    }
    
    addStartingLocation = (address) => {
        this.setState({ 
            startingLocations: [
                ...this.state.startingLocations,
                address
            ] 
        }, this.synchronizeStartingLocationsWithDatabase);
    }

    synchronizeStartingLocationsWithDatabase = async () => {
        console.log("[*] Starting locations: ", this.state.startingLocations);
        await fetch('/synchronize', {
            method: 'POST',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startingLocations: this.state.destinationLocations })
        })
        .then((response) => {
            console.log('Finished API call: ', response);
        }).catch((error) => {
            console.log('[-] Error: ', error);
        });
    }

    addDestinationLocation = (address) => {
        this.setState({ 
            destinationLocations: [
                ...this.state.destinationLocations,
                address
            ] 
        }, this.synchronizeDestinationLocationsWithDatabase);
    }

    synchronizeDestinationLocationsWithDatabase = async () => {
        console.log("[*] Destination locations: ", this.state.destinationLocations);
        await fetch('/synchronize', {
            method: 'POST',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationLocations: this.state.destinationLocations })
        })
        .then((response) => {
            console.log('Finished API call: ', response);
        }).catch((error) => {
            console.log('[-] Error: ', error);
        });
    }

    setCurrentLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.setState({
                    center: [position.coords.latitude, position.coords.longitude],
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            });
        }
    }

    render() {
        const {
            places, mapApiLoaded, mapInstance, mapApi
        } = this.state;

        return (
            <Wrapper>
                {mapApiLoaded && (
                    <div>
                        <AutoComplete map={mapInstance} mapApi={mapApi} addplace={this.addPlace} />
                    </div>
                )}
                <GoogleMapReact
                    center={this.state.center}
                    zoom={this.state.zoom}
                    draggable={this.state.draggable}
                    onChange={this._onChange}
                    onChildMouseDown={this.onMarkerInteraction}
                    onChildMouseUp={this.onMarkerInteractionMouseUp}
                    onChildMouseMouve={this.onMarkerInteraction}
                    onChildClick={() => console.log('child click')}
                    onClick={this._onClick}
                    bootstrapURLKeys={{
                        key: 'AIzaSyAwu5e4u7rC2HaL_TPqRmU2GZwTOh5IfWs',
                        libraries: ['places', 'geometry']
                    }}
                    yesIWantToUseGoogleMapApiInternals
                    onGoogleApiLoaded={({ map, maps }) => this.apiHasLoaded(map, maps)}
                >
                    <Marker
                        text={this.state.address}
                        lat={this.state.lat}
                        lng={this.state.lng}
                    />
                </GoogleMapReact>
                <div className="info-wrapper">
                    <div className="map-details">Latitude: <span>{this.state.lat}</span>, Longitude: <span>{this.state.lng}</span></div>
                    <div className="map-details">Zoom: <span>{this.state.zoom}</span></div>
                    <div className="map-details">Address: <span>{this.state.address}</span></div>
                </div>
                <div>
                    <Button text={"Add Starting Location"} onClick={() => this.addStartingLocation(this.state.address)}/>
                    <Button text={"Add Destination Location"} onClick={() => this.addDestinationLocation(this.state.address)}/>
                </div>
            </Wrapper>
        );
    }
}

export default MyGoogleMap;