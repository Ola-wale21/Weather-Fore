const API_URL = ("https://api.open-meteo.com/v1/forecast");
const dropdown = document.getElementById("units");
const metricTab = document.getElementById("metric");
const place = document.getElementById("get-location");
const todayWeather = document.getElementById("weather-degrees");
const temp = document.getElementById("temp");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const precipitation = document.getElementById("precipitation");
const livePlace = document.getElementById("place");
const searchDate = document.getElementById("date");
const weatherImage = document.getElementById("weather-image");
const hourlyForecast = document.getElementById("hourly-forecast");
const searchPlace = document.getElementById("search");
 const historyContainer = document.getElementById("search-history");
 const mainArea = document.getElementById("weather-area");
const imperial = document.getElementById("imperial")
const celcius = document.getElementById("celcius");
const fahrenheit = document.getElementById("fahrenheit");
const kmh = document.getElementById("kmh");
const mph = document.getElementById("mph");
const millimeters = document.getElementById("millimeters");
const inches = document.getElementById("inches");
const main = document.getElementById("main-area")

const header = document.querySelector(".message");
const searchArea = document.querySelector(".search-area")

const weatherIcon = {
    drizzle: "./assets/images/icon-drizzle.webp",
    fog: "./assets/images/icon-fog.webp",
    overcast: "./assets/images/icon-overcast.webp",
    partlyCloudy: "./assets/images/icon-partly-cloudy.webp",
    rain: "./assets/images/icon-rain.webp",
    snow: "./assets/images/icon-snow.webp",
    storm: "./assets/images/icon-storm.webp",
    sunny: "./assets/images/icon-sunny.webp",
}



var displayIcon = false;

dropdown.addEventListener("click", ()=>{
    if( displayIcon === false){
        metricTab.style.display = "block"
        displayIcon = true;
    } else{
        metricTab.style.display= "none"
        displayIcon = false
    }
    
});

let unitSystem ="metric";

imperial.addEventListener("click", async ()=>{
    if(unitSystem === "metric"){
        fahrenheit.classList.add("click");
        mph.classList.add("click");
        inches.classList.add("click");
        celcius.classList.remove("click");
        kmh.classList.remove("click");
        millimeters.classList.remove("click");
        imperial.textContent = "Switch to Metric"
        unitSystem = "imperial"
        
    }else{
        unitSystem = "metric";
        celcius.classList.add("click");
        kmh.classList.add("click");
        millimeters.classList.add("click");
        fahrenheit.classList.remove("click");
        mph.classList.remove("click");
        inches.classList.remove("click");
         imperial.textContent = "Switch to Imperial"; 
         
    }
    if(coordinateInfo){
         await logCast(coordinateInfo);
    }
})
async function singleCount(place){
    try {
        const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
             params: {
                "name": place,
                "count": 1,
                "language": 'en',
                "format": 'json',
            },
        })
        const places = response.data.results[0];
        const PlaceInfo = {
            name: places.name,
            country: places.country,
            lat: places.latitude,
            lng: places.longitude,
        }
        await logCast(PlaceInfo);
        locationPlace(`${PlaceInfo.name}, ${PlaceInfo.country}`);
              coordinateInfo = PlaceInfo;
    }catch(error){
        console.error(error.message);
            main.style.display = "none";
            const errorDiv = document.createElement("div");
            errorDiv.innerHTML = `<p style = "font-weight: 800; text-align: center; margin: 10px;">No  search results found. Reload page</p>`
            searchArea.appendChild(errorDiv);
    }
}



async function getCoordinates(place) {
   try {
    const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: {
                "name": place,
                "count": 4, // Limit to 4 suggestions
                "language": 'en',
                "format": 'json',
        },
    });
    const places = response.data.results.map(result => ({
        name: result.name,
        country: result.country,
        lat: result.latitude,
        lng: result.longitude,
    }));
    await displaySearch(places);
   }catch(error){
    console.error(error.message);

   }
}

let coordinateInfo;

async function displaySearch (places){
   
    historyContainer.innerHTML= "";
    places.forEach(place => {
        const placeItem = document.createElement("div");
        placeItem.textContent = `${place.name}, ${place.country}`;

        placeItem.addEventListener("click", ()=> {
            logCast(place);
            locationPlace(placeItem.textContent)
            historyContainer.style.display = "none"
            main.style.display = "block";
            searchPlace.value = placeItem.textContent;
            coordinateInfo = place;
        });
        historyContainer.appendChild(placeItem);

    });
}

searchPlace.addEventListener("input", (e) => {
     historyContainer.innerHTML=`<p> <img src="./assets/images/icon-loading.svg" alt="loading" width="20px" style="margin-right: 5px;">Search In Progress</p>`;
    if(historyContainer.style.display === "none"){
        historyContainer.style.display = "block"
       
    }
    const query = e.target.value;
     if (query.length > 2) {
        getCoordinates(query);
    }
})

let weatherResult;

async function getForecast(lat, lng){
    try {
        let params = {
                "latitude": lat,
	            "longitude": lng,
                "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min"],
	            "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "wind_speed_10m", "weather_code"],
                "hourly": ["temperature_2m", "weather_code"],
              
            }
         if(unitSystem === "imperial"){
                params = {
                ...params,
                "wind_speed_unit": "mph",
	            "temperature_unit": "fahrenheit",
	            "precipitation_unit": "inch",
                }
            };
        const result = await axios.get(API_URL, {params});

        weatherResult = result.data;
        const weatherCode = weatherResult.current.weather_code;
        const iconPath = await weatherIcons(weatherCode);
        const weather = await getWeather(weatherResult);
        await dailyTemp(weatherResult);
        await hourTemp(weatherResult);

        return {weather, iconPath};
    } catch (error) {
        console.error(error.message);
        apiError();
    }
}


async function logCast(place) {
    try {
        const coordinates = place;
        const {weather, iconPath} = await getForecast(coordinates.lat, coordinates.lng);
        if(!weather){
            console.log("could not fetch weather");
            apiError();
            return;
        }

        weatherImage.src = iconPath;
        weatherImage.alt= weather.code

        todayWeather.textContent= weather.degree;
        temp.textContent=weather.feelsLike;
        humidity.textContent=weather.humidity;
        wind.textContent=weather.wind;
        precipitation.textContent=weather.precipitation;
    } catch (error) {
        console.error(error.message);
    }
    
}

async function getWeather(weatherResult){
     const weather = {
        degree: weatherResult.current.temperature_2m + "" + weatherResult.current_units.temperature_2m,
        feelsLike: weatherResult.current.apparent_temperature+ "" + weatherResult.current_units.apparent_temperature,
        humidity: weatherResult.current.relative_humidity_2m+ "" + weatherResult.current_units.relative_humidity_2m,
        wind: weatherResult.current.wind_speed_10m+ "" + weatherResult.current_units.wind_speed_10m,
        precipitation: weatherResult.current.precipitation+ "" + weatherResult.current_units.precipitation, 
        code: weatherResult.current.weather_code,
     }

     return weather;
}


async function weatherIcons(weatherCode){
    let iconPath = "./assets/images/icon-sunny.webp";

     if(weatherCode>=0 && weatherCode<=1) {
        iconPath = weatherIcon.sunny;
     }else if (weatherCode == 2){
        iconPath = weatherIcon.partlyCloudy;
     }else if(weatherCode == 3){
        iconPath = weatherIcon.overcast;
     }else if(weatherCode>=45 && weatherCode<=48){
        iconPath = weatherIcon.fog;
     }else if(weatherCode>=51 && weatherCode<=57){
        iconPath = weatherIcon.drizzle;
     }else if (weatherCode>=61 && weatherCode<=67){
        iconPath = weatherIcon.rain;
     }else if(weatherCode>=71 && weatherCode<=77){
        iconPath = weatherIcon.snow;
     }else if(weatherCode>=80 && weatherCode<=82){
        iconPath = weatherIcon.drizzle;
     }else if(weatherCode>=85 && weatherCode<=86){
        iconPath = weatherIcon.snow;
     }else if(weatherCode>=95 && weatherCode<=99){
        iconPath = weatherIcon.storm;
     }
     return iconPath;
     
}


async function dailyTemp(result) {
    const dailyForecast = document.querySelector(".forecast-container");
    for(let i=0; i<7; i++){
        const day = result.daily.time[i];
        const minTemp = result.daily.temperature_2m_min[i] + "" + result.daily_units.temperature_2m_min;
        const maxTemp = result.daily.temperature_2m_max[i] + "" + result.daily_units.temperature_2m_max;
        const weatherCode = result.daily.weather_code[i];

        const weatherData = await  weatherIcons(weatherCode);
        const dayName = new Date(day).toLocaleDateString("en-US", {weekday:"short"});
        
        const dayElement = dailyForecast.children[i];
         if(dayElement){
            dayElement.querySelector(".day").textContent = dayName;
            dayElement.querySelector(".min-temp").textContent = minTemp;
            dayElement.querySelector(".max-temp").textContent = maxTemp;
            const icon = dayElement.querySelector("#img-icon");
         if(icon){
            icon.src = weatherData;
            icon.alt = weatherCode;
         }
           
         }
        
    }
}

async function hourTemp(result){
    for(let i = hourlyForecast.children.length; i< 24; i++){
        const newElement = document.createElement("div");
        
        newElement.innerHTML = `
        <img src="" alt="" class="hour-code">
          <p class="hour-time"></p>
          <p class="hour-temp"></p>`;
     hourlyForecast.appendChild(newElement);
    }

    for(let i=0; i<24; i++){
        const time = result.hourly.time[i];
        const temp = result.hourly.temperature_2m[i] + "" + result.hourly_units.temperature_2m;
        const code = result.hourly.weather_code[i];

        const weatherData = await weatherIcons(code);
        const timeFormat = new Date(time).toLocaleTimeString("en-US", {hour:'numeric', hour12: true});
        
        const timeElement = hourlyForecast.children[i];
        const hourCode = timeElement.querySelector(".hour-code");
        if(hourCode){
            hourCode.src = weatherData;
            hourCode.alt = code;
        }
        if(timeElement){
            timeElement.querySelector(".hour-time").textContent = timeFormat;
            timeElement.querySelector(".hour-temp").textContent = temp;
        }

    }
}



function locationPlace(place) {
    var name = place;
    var firstLetter= name.slice(0,1).toUpperCase();
    var restLetter = name.slice(1,name.length)
    livePlace.textContent = firstLetter+restLetter;

    const currentDate = new Date();
    const option = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    const formattedDate = currentDate.toLocaleDateString('en-US', option);
    searchDate.textContent = formattedDate;
}



place.addEventListener("click", async ()=> {
    const location = document.getElementById("search").value.trim();
    if (location) {
        singleCount(location);
        historyContainer.style.display = "none";
        main.style.display = "block";
    }else {
        header.textContent="Please enter a location";
    }
});



document.addEventListener("DOMContentLoaded", ()=> {
    const daySelect = document.getElementById("daysInWeek");
    if(daySelect){
     daySelect.addEventListener("change", (event) => {
    const selectedDay = event.target.value.toLowerCase();
    console.log(selectedDay);
    if(weatherResult){
        getIndex(selectedDay, weatherResult);
    }
    
})
    }
});

function getDay(dateString){
    const date = new Date(dateString);
    const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    return dayNames[date.getDay()];
}

async function getIndex(selectedDay, times){
    const hourArray = times.hourly.time
    const selectedIndex = [];

    hourArray.forEach((time, index) => {
        const dayOfWeek = getDay(time);
        if(dayOfWeek === selectedDay){
            selectedIndex.push(index)
        }
    });

    for(let i=0; i<selectedIndex.length; i++ ){
    const index = selectedIndex[i];
    const dayForecast = hourArray[index];
    const temps = times.hourly.temperature_2m[index] + "" +times.hourly_units.temperature_2m;
    const codes = times.hourly.weather_code[index];

    const weatherDatas = await weatherIcons(codes);
    const timeFormat = new Date(dayForecast).toLocaleTimeString("en-US", {hour:"numeric", hour12: true});

    const timeElement = hourlyForecast.children[i];
    const hourCode = timeElement.querySelector(".hour-code");
    if(hourCode) {
        hourCode.src = weatherDatas;
        hourCode.alt = codes;
    }
    if(timeElement){
        timeElement.querySelector(".hour-time").textContent = timeFormat;
        timeElement.querySelector(".hour-temp").textContent = temps;
    }

    }
   

}
function apiError (){
     main.style.display = "none";
        searchArea.style.display = "none"
            header.innerHTML =`<img src="./assets/images/icon-error.svg" alt="error" style="width: 70px; display: block; text-align: center;">
                                <p>Something Went Wrong</p>`;
            const errorDiv = document.createElement("div");
            errorDiv.classList.add("hidden-message")
            errorDiv.innerHTML = `
            <p>We could not connect to the server(API error). Please try again in a few moment</p>
            <button id="reload-btn"><img src="./assets/images/icon-retry.svg" alt="retry" style="width: 20px; margin-right: 20px;">Retry</button>`
            header.appendChild(errorDiv);

            const reloadButton = document.getElementById("reload-btn");
            reloadButton.addEventListener("click", () => {
                location.reload();
            })
}