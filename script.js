
+document.addEventListener("DOMContentLoaded", () => {
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
        const nominatimURL = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        fetch(nominatimURL)
            .then(response => response.json())
            .then(data => {
                const city = data.address.city || data.address.town || data.address.village;

                if (city) {
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
        const apiKey = 'dd6a2280fce50c5c899dc7c815a82f87';
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
            getWeather(this.value);
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
        document.getElementById("city-name").innerText = `${cityName}`;
        document.getElementById("weather-description").innerText = `${description}`;
        document.getElementById("sunrise").innerText = `🌅 Sunrise : ${sunriseTime}`;
        document.getElementById("sunset").innerText = `🌇 Sunset : ${sunsetTime}`;
        document.getElementById("humidity").innerText = `Humidity : ${humidity}%`;
        document.getElementById("wind-speed").innerText = `Wind Speed : ${windSpeed} km/h`;
        document.getElementById("date").innerText = `Date : ${formattedDate}`;
        document.getElementById("time").innerText = `Time : ${formattedTime}`;

        const weatherHTML = ``;

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
            videoElement.pause();
            videoElement.src = videoSrc;
            videoElement.load();
            videoElement.play().catch(error => console.error("Autoplay blocked:", error));
        }        
    }

    function displayWeeklyForecast(forecastData) {
        const weeklyForecastDiv = document.getElementById('forecast-container');
        weeklyForecastDiv.innerHTML = "";
    
        const dailyData = {};
        const today = new Date();
        const forecastDates = [];
    
        forecastData.forEach(entry => {
            const dateObj = new Date(entry.dt * 1000);
            const date = dateObj.toISOString().split('T')[0];
    
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
                forecastDates.push(date);
            } else {
                dailyData[date].tempMax = Math.max(dailyData[date].tempMax, entry.main.temp);
                dailyData[date].tempMin = Math.min(dailyData[date].tempMin, entry.main.temp);
            }
    
            if (entry.sys && entry.sys.sunrise && entry.sys.sunset) {
                dailyData[date].sunrise = new Date(entry.sys.sunrise * 1000).toLocaleTimeString();
                dailyData[date].sunset = new Date(entry.sys.sunset * 1000).toLocaleTimeString();
            }
        });
    
        while (forecastDates.length < 7) {
            const lastDate = new Date(forecastDates[forecastDates.length - 1] || today);
            lastDate.setDate(lastDate.getDate() + 1);
            const nextDate = lastDate.toISOString().split('T')[0];
    
            if (!dailyData[nextDate]) {
                dailyData[nextDate] = {
                    tempMax: "-",
                    tempMin: "-",
                    icon: "01d",
                    description: "No data",
                    humidity: "-",
                    windSpeed: "-"
                };
            }
            forecastDates.push(nextDate);
        }
    
        let forecastHTML = "";
forecastDates.slice(0, 7).forEach(date => {
    const { tempMax, tempMin, icon, description, humidity, windSpeed, sunrise, sunset } = dailyData[date] || {};
    const iconURL = `https://openweathermap.org/img/wn/${icon}.png`;

    forecastHTML += `
        <div class="daily-item" onclick="toggleDetails('${date}')">
            <span>${new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <img src="${iconURL}" alt="${description}">
            <span>${description}</span>
            <span>${tempMax !== "-" ? Math.round(tempMax) + "°C / " + Math.round(tempMin) + "°C" : "No Data"}</span>
        </div>
        <div id="details-${date}" class="daily-details">
            <p><strong>🌅Sunrise:</strong> ${sunrise || "N/A"}</p>
            <p><strong>🌇Sunset:</strong> ${sunset || "N/A"}</p>
            <div id="left">
                    <i class="fa-solid fa-water"></i>
                    <p id="humidity">Humidity: ${humidity}%</p>
                    <i class="fa-solid fa-wind wind"></i>
                    <p id="wind-speed">Wind Speed: ${windSpeed} km/h</p>
                </div>
        </div>
    `;
});
weeklyForecastDiv.innerHTML = forecastHTML;
    }    

    function toggleDetails(date) {
        document.querySelectorAll('.daily-details').forEach(detail => {
            if (detail.id !== `details-${date}`) {
                detail.classList.remove("show");
                setTimeout(() => {
                    detail.style.display = "none";
                }, 500);
            }
        });
    
        const detailsDiv = document.getElementById(`details-${date}`);
    
        if (detailsDiv) {
            if (!detailsDiv.classList.contains("show")) {
                detailsDiv.style.display = "block";
                setTimeout(() => {
                    detailsDiv.classList.add("show");
                }, 10);
            } else {
                detailsDiv.classList.remove("show");
                setTimeout(() => {
                    detailsDiv.style.display = "none";
                }, 500);
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

        const loginBtn = document.getElementById("login-btn");
        loginBtn.innerText = "Logout";
        loginBtn.removeEventListener("click", openLoginModal);
        loginBtn.addEventListener("click", logout);
    } else {
        alert("Invalid username or password.");
    }
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");

    alert("Logged out successfully!");

    const loginBtn = document.getElementById("login-btn");
    loginBtn.innerText = "Login";
    loginBtn.removeEventListener("click", logout);
    loginBtn.addEventListener("click", openLoginModal);
}

window.onload = function () {
    getWeather("Delhi");

    const loginBtn = document.getElementById("login-btn");
    if (localStorage.getItem("isLoggedIn") === "true") {
        loginBtn.innerText = "Logout";
        loginBtn.addEventListener("click", logout);
    } else {
        loginBtn.innerText = "Login";
        loginBtn.addEventListener("click", openLoginModal);
    }
};

function openLoginModal() {
    document.getElementById("login-modal").style.display = "flex";
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
