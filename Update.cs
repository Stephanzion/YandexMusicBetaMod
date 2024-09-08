using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace YandexMusicPatcherGui
{
    public static class Update
    {
        /// <summary>
        /// Хитрым образом проверяет последнюю версию релиза, выложенного на гитхабе.
        /// Тэг последнего релиза можно получить узнав url редиректа, сделав запрос на
        /// /releases/latest
        /// </summary>
        public static async Task<string> GetLastVersion()
        {
            try
            {
                HttpClientHandler httpClientHandler = new HttpClientHandler();
                httpClientHandler.AllowAutoRedirect = false;
                var client = new HttpClient(httpClientHandler);
                var request = new HttpRequestMessage(HttpMethod.Get,
                    "https://github.com/Stephanzion/YandexMusicBetaMod/releases/latest");
                var response = await client.SendAsync(request);
                var redirectUrl = response.Headers.Location.ToString();
                var lastVersion = redirectUrl.Split('/').Last().Replace("v", "");

                return lastVersion;
            }
            catch
            {
                return "error";
            }
        }
    }
}