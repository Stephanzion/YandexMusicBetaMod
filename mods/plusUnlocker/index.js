// Заменить hasPlus на true, когда яндекс получает информацию о текущем пользователе
window.AddYandexApiFetchHandler("api.music.yandex.net/account/about", function (response) {
  response.data.hasPlus = true;
  console.log(`[PlusUnlocker] Change hasPlus value:`, response.data);
  return response.data;
});

//отключить шпионский фрейм
//https://yandex.ru/user-id?encodedRetpath=music-application...
//в том числе содержащий информацию о наличии плюса
//
//На данный момент отключено, тк ломает механизм настроек и выхода из аккаунта

//URL.prototype.toString = function () {
//  if (this.href.includes("yandex.ru/user-id")) {
//    console.log(`[PlusUnlocker] Block URL: ${this.href}`);
//    return "";
//  } else return this.href;
//};

// Автоматически нажать на кнопку входа чтобы не смущать пользователя сообщением о том, что необходим плюс
setInterval(function () {
  var loginButton = document.querySelector('button[class*="WelcomePage_loginButton__"]');
  if (loginButton) loginButton.click();
}, 500);
