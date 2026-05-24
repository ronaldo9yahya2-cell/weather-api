
Overview: 
I need a small API integra4on service built in Node.js that pulls weather data from a free public 
API, processes it, and exposes a simplified endpoint our other tools can consume. Basically a 
middleware layer that reformats and caches weather data. 
 
Scope of work: 
- Node.js + Express service 
- On startup (and every 30 minutes via a scheduled job), fetch current weather data from 
OpenWeatherMap's free API for 5 hardcoded city names 
- Store fetched data in an in-memory cache (a simple JS object or lightweight library like node-
cache) 
- Expose the following custom endpoints: 
- `GET /weather` — returns all 5 ci4es with: city name, temperature in both Celsius and 
Fahrenheit, humidity, wind speed, a simple condi4on label (Sunny/Cloudy/Rainy/Snowy based 
on the weather code), and the 4mestamp of last fetch 
- `GET /weather/:city` — returns data for 1 city 
- `GET /weather/compare?ci4es=cityA,cityB` — returns a side-by-side comparison object for 2 
ci4es 
- `GET /health` — returns up4me and last successful fetch 4me 
 
References: 
Resources: 
- OpenWeatherMap freemium plan API: 
h^ps://openweathermap.org/appid 
- OpenWeatherMap API docs: h^ps://openweathermap.org/current 
 
apikey : your_api_key_here   (real key is kept out of version control — set OPENWEATHER_API_KEY in your local .env)

Addi4onal informa4on:
Addi4onal Requirements: 
- If external API is down, serve stale cached data and include a `"stale": true` flag in the 
response 
- Rate limi4ng: max 30 requests per minute per IP using express-rate-limit 
- Include a `.env.example` file showing where to put the API key 
- Ci4es to use: Oslo, Lisbon, Nairobi, Osaka, Medellín 
- Response format should be clean and flat — no deeply nested objects 
- Deploy the live prototype to a free hos4ng service like Vercel, Netlify, or GitHub Page 
- NO AI SLOP. Send daily work-in-progress screenshots 
 
Required Deliverables: 
1. Link to the live hosted site. 
2. Zip file containing the clean, commented source code. 
3. README document explaining where and how to swap out the free API key 
 
- I've never set up an API key before so please make the README really clear. Also, the compare 
endpoint is important to us. Make sure it calculates the difference in temperature and humidity 
between the 2 ci4es and includes that in the response. 