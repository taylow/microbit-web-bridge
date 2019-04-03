import axios from 'axios';
import {AbstractHubAuthApiService} from './core';

interface Wind {
    speed: number,
    degree: number,
}

interface Pressure {
    pressure: number,
    sea_level: number,
}

interface Temperature {
    minimal: number,
    average: number,
    maximal: number,
}


interface Weather {
    status: string,
    detailed_status: string,
    clouds_percentage: number,
    code: number,
    weather_at: string,
    wind: Wind,
    pressure: Pressure,
    temperature: Temperature,
}

export default class WeatherHubAPIService extends AbstractHubAuthApiService {
    async getCurrentWeather(queryParams: object): Promise<Weather> {
        try {
            const response = await axios.get('/micro-bit/weather/current/', { params: queryParams });
            return response.data;
        } catch (error) {
            throw new Error(JSON.stringify(error.response.data));
        }
    }

    async getTomorrowWeather(queryParams: object): Promise<Weather> {
        try {
            const response = await axios.get('/micro-bit/weather/forecast/tomorrow/', { params: queryParams });
            return response.data;
        } catch (error) {
            throw new Error(JSON.stringify(error.response.data));
        }
    }
}
