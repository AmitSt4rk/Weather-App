document.addEventListener("DOMContentLoaded", () => {
    const locationButton = document.getElementById("get-location");
    const videoElement = document.getElementById("bg-video");

    if (locationButton) {
        locationButton.addEventListener("click", () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        getCityFromCoords(lat, lon);
                    },
                    (error) => {
                        console.warn("Geolocation error:", error);
                        fetchIPBasedLocation();
                    }
                );
            } else {
                alert("Geolocation is not supported by this browser.");
                fetchIPBasedLocation();
            }
        });
    }
    function playVideo() {
        videoElement.play().catch(error => console.error("Autoplay prevented. User interaction needed.", error));
    }

    document.addEventListener("click", playVideo, { once: true });
    document.addEventListener("keydown", playVideo, { once: true });

    getWeather("Delhi");

    document.getElementById("city").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            getWeather();
        }
    });
});

    function fetchIPBasedLocation() {
        fetch("https://ip-api.com/json/")
            .then(response => response.json())
            .then(data => {
                console.log("IP-based location:", data);
                getWeather(data.city || "Delhi");
            })
            .catch(error => {
                console.error("Error fetching location:", error);
                getWeather("Delhi");
            });
    }

    function getCityFromCoords(lat, lon) {
        console.log(`Fetching city for coordinates: lat=${lat}, lon=${lon}`);

        const nominatimURL = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        fetch(nominatimURL)
            .then(response => response.json())
            .then(data => {
                console.log("Nominatim API Response:", data);
                const city = data.address.city || data.address.town || data.address.village;

                if (city) {
                    console.log("City found:", city);

                    const cityInput = document.getElementById('city');
                    if (cityInput) {
                        cityInput.value = city;
                    }

                    getWeather(city);
                } else {
                    console.warn("City not found. Using default.");
                    getWeather("Delhi");
                }
            })
            .catch(error => {
                console.error("Error fetching city:", error);
                getWeather("Delhi");
            });
    }

    let globalSunrise = "-";
    let globalSunset = "-";

    function getWeather(city) {
        const apiKey = '8ebe3cc4b0688494d81edf9a65c6c8e5';
        const cityInput = document.getElementById('city');

        if (!city) {
            city = cityInput ? cityInput.value.trim() : "Delhi";
        }

        if (!city || city.trim() === "") {
            console.warn('No city provided, using default city.');
            city = "Delhi";
        }

        const currentWeatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

        fetch(currentWeatherURL)
            .then(response => response.json())
            .then(data => {
                displayWeather(data);

                globalSunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
                globalSunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();

                return fetch(forecastURL);
            })
            .then(response => response.json())
            .then(forecastData => {
                displayHourlyForecast(forecastData.list);
                displayWeeklyForecast(forecastData.list);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                displayError(error.message);
            });
    }

    window.onload = function () {
        getWeather("Delhi");
    };

    document.getElementById("city").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            getWeather();
        }
    });

    function displayError(message) {
        const tempDivInfo = document.getElementById('temp-div');
        const weatherInfoDiv = document.getElementById('weather-info');
        const weatherIcon = document.getElementById('weather-icon');
        const hourlyForecastDiv = document.getElementById('hourly-forecast');

        tempDivInfo.innerHTML = "";
        weatherInfoDiv.innerHTML = `<p style="color: red;">${message}</p>`;
        weatherIcon.style.display = "none";
        hourlyForecastDiv.innerHTML = "";
    }

    function displayWeather(data) {
        const tempDivInfo = document.getElementById('temp-div');
        const weatherInfoDiv = document.getElementById('weather-info');
        const weatherIcon = document.getElementById('weather-icon');

        if (data.cod === '404') {
            weatherInfoDiv.innerHTML = `<p>${data.message}</p>`;
            weatherIcon.style.display = 'none';
            return;
        }

        const cityName = data.name;
        const temperature = data.main.temp.toFixed(1);
        const description = data.weather[0].description;
        const humidity = data.main.humidity;
        const windSpeed = (data.wind.speed * 3.6).toFixed(1);
        const iconCode = data.weather[0].icon;
        const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const mainWeather = data.weather[0].main.toLowerCase();

        let currentTime = new Date();
        const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
        const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString();

        updateBackgroundVideo(data);

        const timestamp = data.dt * 1000;
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();

        const temperatureHTML = `<p>${temperature}°C</p>`;
        const weatherHTML = `
        <p><strong>City:</strong> ${cityName}</p>
        <p><strong>Weather:</strong> ${description}</p>;
        <p><strong>Humidity:</strong> ${humidity}%</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>;
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>;
        <p><strong>🌅 Sunrise:</strong> ${sunriseTime}</p>
        <p><strong>🌇 Sunset:</strong> ${sunsetTime}</p>`;

        tempDivInfo.innerHTML = temperatureHTML;
        weatherInfoDiv.innerHTML = weatherHTML;
        weatherIcon.src = iconURL;
        weatherIcon.alt = description;
        weatherIcon.style.display = 'block';
    }

    function updateBackgroundVideo(weatherData) {
        const videoElement = document.getElementById('bg-video');
        const currentTime = new Date().getTime() / 1000;
        const sunrise = weatherData.sys.sunrise;
        const sunset = weatherData.sys.sunset;

        let isNight = currentTime < sunrise || currentTime > sunset;
        let weatherCondition = weatherData.weather[0].main.toLowerCase();
        let videoSrc = "";

        if (weatherCondition.includes("clear")) {
            videoSrc = isNight ? "Videos/clear-night.mp4" : "Videos/clear-day.mp4";
        } else if (weatherCondition.includes("clouds")) {
            if (weatherData.weather[0].description.includes("few")) {
                videoSrc = isNight ? "Videos/few-clouds-night.mp4" : "Videos/few-clouds-day.mp4";
            } else if (weatherData.weather[0].description.includes("scattered")) {
                videoSrc = isNight ? "Videos/scattered-clouds-night.mp4" : "Videos/scattered-clouds-day.mp4";
            } else {
                videoSrc = isNight ? "Videos/broken-clouds-night.mp4" : "Videos/broken-clouds-day.mp4";
            }
        } else if (weatherCondition.includes("rain")) {
            videoSrc = isNight ? "Videos/rain-night.mp4" : "Videos/rain-day.mp4";
        } else if (weatherCondition.includes("thunderstorm")) {
            videoSrc = isNight ? "Videos/thunderstorm-night.mp4" : "Videos/thunderstorm-day.mp4";
        } else if (weatherCondition.includes("snow")) {
            videoSrc = isNight ? "Videos/snow-night.mp4" : "Videos/snow-day.mp4";
        } else if (weatherCondition.includes("mist") || weatherCondition.includes("haze") || weatherCondition.includes("fog")) {
            videoSrc = isNight ? "Videos/mist-night.mp4" : "Videos/mist-day.mp4";
        } else if (weatherCondition.includes("sand") || weatherCondition.includes("dust")) {
            videoSrc = isNight ? "Videos/sandstorm-night.mp4" : "Videos/sandstorm-day.mp4";
        } else {
            videoSrc = isNight ? "Videos/default-night.mp4" : "Videos/default-day.mp4";
        }

        if (videoElement.src !== videoSrc) {
            videoElement.src = videoSrc;
            videoElement.load();

            videoElement.play().catch(error => {
                console.error("Autoplay was prevented:", error);
            });
        }
    }

    function getWeeklyForecast(city) {
        const apiKey = '8ebe3cc4b0688494d81edf9a65c6c8e5';
        const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

        fetch(forecastURL)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const forecastContainer = document.getElementById("weekly-forecast");
                forecastContainer.innerHTML = "";

                data.list.forEach((day, index) => {
                    let date = new Date(day.dt * 1000).toDateString();
                    forecastContainer.innerHTML += `
                    <div class="forecast-day">
                        <p>${date}</p>
                        <p>Temp: ${main.temp}°C</p> <!-- Error: should be day.main.temp -->
                        <p>${day.weather[0].description}</p>
                    </div>
                `;
                });
            })
            .catch(error => console.log("Error fetching data:", error));
    }

    function displayWeeklyForecast(forecastData) {
        const weeklyForecastDiv = document.getElementById('forecast-container');
        weeklyForecastDiv.innerHTML = "";

        const dailyData = {};

        forecastData.forEach(entry => {
            const dateObj = new Date(entry.dt * 1000);
            const date = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

            if (!dailyData[date]) {
                dailyData[date] = {
                    tempMax: entry.main.temp,
                    tempMin: entry.main.temp,
                    icon: entry.weather[0].icon,
                    description: entry.weather[0].description,
                    humidity: entry.main.humidity,
                    windSpeed: (entry.wind.speed * 3.6).toFixed(1),
                    sunrise: globalSunrise,
                    sunset: globalSunset
                };
            } else {
                dailyData[date].tempMax = Math.max(dailyData[date].tempMax, entry.main.temp);
                dailyData[date].tempMin = Math.min(dailyData[date].tempMin, entry.main.temp);
            }

            if (entry.sys && entry.sys.sunrise && entry.sys.sunset) {
                dailyData[date].sunrise = new Date(entry.sys.sunrise * 1000).toLocaleTimeString();
                dailyData[date].sunset = new Date(entry.sys.sunset * 1000).toLocaleTimeString();
            }
        });

        Object.keys(dailyData).slice(0, 7).forEach(date => {
            const { tempMax, tempMin, icon, description, humidity, windSpeed, sunrise, sunset } = dailyData[date];
            const iconURL = `https://openweathermap.org/img/wn/${icon}.png`;

            const sunriseTime = sunrise;
            const sunsetTime = sunset;

            const dayHtml = `
            <div class="daily-item" onclick="toggleDetails('${date}')">
                <span>${date}</span>
                <img src="${iconURL}" alt="${description}">
                <span>${description}</span>
                <span>${Math.round(tempMax)}°C / ${Math.round(tempMin)}°C</span>
            </div>
            <div id="details-${date}" class="daily-details" style="display: none;">
                <p><strong>Humidity:</strong> ${humidity}%</p>
                <p><strong>Wind Speed:</strong> ${windSpeed} km/h</p>
                <p><strong>🌅Sunrise:</strong> ${sunrise}</p>
                <p><strong>🌇Sunset:</strong> ${sunset}</p>
            </div>
        `;
            weeklyForecastDiv.innerHTML += dayHtml;
        });
    }

    function toggleDetails(date) {
        document.querySelectorAll('.daily-details').forEach(detail => {
            if (detail.id !== `details-${date}`) {
                detail.style.display = "none";
            }
        });

        const detailsDiv = document.getElementById(`details-${date}`);

        if (detailsDiv) {
            if (detailsDiv.style.display === "none" || detailsDiv.style.display === "") {
                detailsDiv.style.display = "block";
            } else {
                detailsDiv.style.display = "none";
            }
        } else {
            console.error("Element not found:", `details-${date}`);
        }
    }



    function displayHourlyForecast(hourlyData) {
        const hourlyForecastDiv = document.getElementById('hourly-forecast');
        hourlyForecastDiv.innerHTML = "";

        hourlyData.slice(0, 8).forEach(item => {
            const dateTime = new Date(item.dt * 1000);
            const hour = dateTime.getHours();
            const temperature = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

            const hourlyItemHtml = `
            <div class="hourly-item">
                <span>${hour}:00</span>
                <img src="${iconUrl}" alt="Hourly Weather Icon">
                <span>${temperature}°C</span>
            </div>
        `;

            hourlyForecastDiv.innerHTML += hourlyItemHtml;
        });
    }

document.getElementById("login-btn").addEventListener("click", function () {
    document.getElementById("login-modal").style.display = "flex";
});

document.getElementById("show-signup").addEventListener("click", function () {
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("signup-modal").style.display = "flex";
});

document.querySelectorAll(".close").forEach(closeBtn => {
    closeBtn.addEventListener("click", function () {
        document.getElementById("login-modal").style.display = "none";
        document.getElementById("signup-modal").style.display = "none";
    });
});

function signup() {
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;

    if (username && password) {
        localStorage.setItem("user_" + username, password);
        alert("Sign Up Successful! Please log in.");
        document.getElementById("signup-modal").style.display = "none";
        document.getElementById("login-modal").style.display = "flex";
    } else {
        alert("Please fill all fields.");
    }
}

function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    const storedPassword = localStorage.getItem("user_" + username);

    if (storedPassword && storedPassword === password) {
        alert("Login Successful!");
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        document.getElementById("login-modal").style.display = "none";
        document.getElementById("login-btn").innerText = "Logout"; 
    } else {
        alert("Invalid Username or Password");
    }
}

document.getElementById("login-btn").addEventListener("click", function () {
    if (localStorage.getItem("isLoggedIn") === "true") {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        alert("Logged out!");
        document.getElementById("login-btn").innerText = "Login";
    } else {
        document.getElementById("login-modal").style.display = "flex";
    }
});

window.onload = function () {
    if (localStorage.getItem("isLoggedIn") === "true") {
        document.getElementById("login-btn").innerText = "Logout";
    }
};
