/* Napisz — formularz kontaktowy przez formsubmit.co (bez przeładowania strony).
   Adres skrzynki: data-adres i action na <form id="formularz"> (oba zmieniać razem).
   Pierwsza wiadomość na nowy adres wysyła na niego link „Activate Form” — trzeba go kliknąć. */
(function () {
  var form = document.getElementById("formularz");
  if (!form) return;
  var adres = form.getAttribute("data-adres");
  var przycisk = form.querySelector(".napisz__wyslij");
  var status = form.querySelector(".napisz__status");
  var dzieki = document.getElementById("dzieki");

  function pokazDzieki() {
    form.hidden = true;
    dzieki.hidden = false;
    dzieki.focus();
  }
  if (/[?&]wyslano=1/.test(location.search)) pokazDzieki();   // powrót z wysyłki bez JS (_next)

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements._honey.value) return;                     // wypełnił to bot

    var dane = {};
    new FormData(form).forEach(function (v, k) {
      if (k === "_next") return;
      dane[k] = dane[k] ? dane[k] + ", " + v : v;                // kilka zaznaczonych usług w jednej linii
    });

    przycisk.disabled = true;
    przycisk.textContent = "Wysyłam…";
    status.textContent = "";

    fetch("https://formsubmit.co/ajax/" + adres, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(dane)
    })
      .then(function (r) { return r.json(); })
      .then(function (o) {
        if (o.success === true || o.success === "true") return pokazDzieki();
        throw new Error(o.message);
      })
      .catch(function () {
        przycisk.disabled = false;
        przycisk.textContent = "Wyślij wiadomość";
        status.innerHTML = "Nie udało się wysłać. Spróbuj jeszcze raz albo napisz bezpośrednio: " +
          '<a href="mailto:' + adres + '">' + adres + "</a>.";
      });
  });
})();
