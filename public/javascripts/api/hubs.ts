import axios from 'axios';
import {AbstractApiService} from './core';

interface Hub {
    id: number,
    uid: string,
    name: string,
    type: string,
    sub_location_id: number,
    description: string,
    created_at: string,
}

class HubsAPIService extends AbstractApiService {
    async getWebHubs(): Promise<Array<Hub>> {
        try {
            const response = await axios.get('/hubs/');
            return response.data.filter((hub: Hub) => hub.type === "browser");
        } catch (error) {
            throw new Error(JSON.stringify(error.response.data));
        }
    }

    async getHubFirmware(hubUid: string): Promise<ArrayBuffer> {
        try {
            const response = await axios.get('/hubs/microbit-firmware/', {
                params: {uid: hubUid},
                responseType: 'arraybuffer',
            });
            return response.data;
        } catch (error) {
            throw new Error(JSON.stringify(error.response.data));
        }
    }
}

export default new HubsAPIService();
