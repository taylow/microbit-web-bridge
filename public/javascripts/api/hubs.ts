import axios from 'axios';
import AbstractApiService from './core';

class HubsAPIService extends AbstractApiService {
    async getHubs() {
        try {
            const response = await axios.get('/hubs/');
            console.log(response.data)
            return response.data;
        } catch (error) {
            throw new Error(JSON.stringify(error.response.data));
        }
    }
}

export default new HubsAPIService();
