export function getMlPlayerId(data: any) {
    try {
        console.log(data, "data object")
        // const data = JSON.parse(jsonString);
        return `${data.required_information.player_id.replace(/\s/g,'')
        }${data.required_information.zone_id.replace(/\s/g,'')
        }`;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}

export function getGarenaPlayerId(data: any) {
    try {
        console.log(data, "data object")
        // const data = JSON.parse(jsonString);
        return `${data.required_information.player_id.replace(/\s/g,'')
        }`;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}