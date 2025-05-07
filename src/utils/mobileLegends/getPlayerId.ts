export function getMlPlayerId(data: any) {
    try {
        console.log(data, "data object")
        // const data = JSON.parse(jsonString);
        return `${data.required_information.player_id}${data.required_information.zone_id}`;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}

export function getGarenaPlayerId(data: any) {
    try {
        console.log(data, "data object")
        // const data = JSON.parse(jsonString);
        return `${data.required_information.player_id}${data.required_information.username}`;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}