const { Client } = require("@xhayper/discord-rpc");

const clientId = "1283109459463377011";
const discordActivityCooldown = 10 * 1000;
var lastActivityChanged = Date.now();

var rpc;
function initRpc(){
    rpc = new Client({ clientId: clientId });

    rpc.login().catch(e => {
        console.error("[DISCORD RPC]", e);
        setTimeout(initRpc, 3000);
    });

    rpc.on("ready", () => {
        console.log("[DISCORD RPC] Hooked!");
    });

    rpc.on("disconnected", () => {
        console.log("[DISCORD RPC] Disconnected");
        setTimeout(initRpc, 3000);
    });

    rpc.on("error", () => {
        console.log("[DISCORD RPC] Error");
        setTimeout(initRpc, 3000);
    });
    rpc.on("close", () => {
        console.log("[DISCORD RPC] Closed");
        setTimeout(initRpc, 3000);
    });

};


async function activityLoop() {
    setTimeout(activityLoop, 500);

    if (lastActivityChanged + discordActivityCooldown > Date.now()) return;

    if (!rpc.user) return;

    try {
        var playerState = await GetAppPlayerState();

        var startTimestamp = Date.now() - timeToTimestamp(playerState.timerStart) - 1000;
        var endTimestamp = Date.now() + timeToTimestamp(playerState.timerEnd) - timeToTimestamp(playerState.timerStart);

        var request = {
            type: 2,
            details: playerState.trackTitle,
            largeImageKey: playerState.trackImage,
            state: playerState.trackArtists,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            buttons: [
                {
                    label: "🎵 Открыть трек",
                    url: `https://music.yandex.ru/album/${playerState.trackId}`,
                },
                {
                    label: "💻 Yandex Music Mod",
                    url: `https://github.com/Stephanzion/YandexMusicBetaMod`,
                },
            ],
            instance: false,
        };

        if (playerState.isPlaying) {
            console.log("[DISCORD RPC] request:", request);
            rpc.user.setActivity(request);
        } else {
            console.log("[DISCORD RPC] clearActivity");
            rpc.user.clearActivity();
        }

        lastActivityChanged = Date.now();
    } catch (ex) {
        console.log("[DISCORD RPC]", ex);
    }
}

initRpc();
activityLoop();

function timeToTimestamp(timeStr) {
    const [minutes, seconds] = timeStr.split(":").map(Number);
    return (minutes * 60 + seconds) * 1000;
}
async function GetAppPlayerState() {
    return window.webContents.executeJavaScript(`
    
    (()=>{

        var player = document.querySelector('section[data-test-id="PLAYERBAR_DESKTOP"]') || document.querySelector('section[class*="PlayerBarMobile_root__"]') ;

        var titleElement = player.querySelector('a[data-test-id="TRACK_TITLE"]') || player.querySelector('span[class*="Meta_title__"]')
        var artistsElement = player.querySelector('span[class*="Meta_albumTitle__"]') || player.querySelectorAll('a[data-test-id="SEPARATED_ARTIST_TITLE"]')
        var trackTitle = titleElement.innerText.trim()
        var trackArtists = (artistsElement instanceof NodeList ? [...artistsElement] :  [artistsElement] ).map(x=>x.innerText.trim()).join(', ')
        var imageElement = player.querySelector('img[data-test-id="ENTITY_COVER"]') || player.querySelector('img[data-test-id="ENTITY_COVER_IMAGE"]')
        var trackImage = imageElement.src;
        var timerStart = player.querySelector('span[data-test-id="TIMECODE_TIME_START"]')?.innerText.trim()
        var timerEnd = player.querySelector('span[data-test-id="TIMECODE_TIME_END"]')?.innerText.trim()
        var idElement = player.querySelector('a[data-test-id="TRACK_TITLE"]') || player.querySelector('a[class*=Meta_link__]');
        var trackId = idElement.href.trim().split('=').at(-1);
        var isPlaying = !!player.querySelector('button[data-test-id="PAUSE_BUTTON"]');

        return {trackTitle,trackArtists,trackImage,timerStart,timerEnd,trackId,isPlaying};
        
    })()
    
    `);
}