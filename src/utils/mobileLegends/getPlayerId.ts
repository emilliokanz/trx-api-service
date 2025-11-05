export function getMlPlayerId(data: any) {
    try {
        const playerId = data?.required_information?.player_id;
        const zoneId = data?.required_information?.zone_id;

        if (!playerId || !zoneId) {
            console.error("Missing player_id or zone_id");
            return null;
        }

        // Remove whitespace only if present and it's a string
        const cleanPlayerId = typeof playerId === "string" ? playerId.replace(/\s+/g, "") : playerId;
        const cleanZoneId = typeof zoneId === "string" ? zoneId.replace(/\s+/g, "") : zoneId;

        return `${cleanPlayerId}${cleanZoneId}`;
    } catch (error) {
        console.error("Error in getMlPlayerId:", error);
        return null;
    }
}


export function getGarenaPlayerId(data: any) {
    try {
        console.log(data, "data object")
        // const data = JSON.parse(jsonString);
        return `${data.required_information.player_id.replace(/\s/g, '')
            }`;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}