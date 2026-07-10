function limpiarTexto(valor) {
    if (valor === null || valor === undefined) {
        return '';
    }

    const texto = String(valor).trim();

    if (
        texto.toLowerCase() === 'nan' ||
        texto.toLowerCase() === 'none' ||
        texto.toLowerCase() === 'null'
    ) {
        return '';
    }

    return texto;
}

function formatoPorcentaje(valor) {
    const limpio = limpiarTexto(valor);

    if (limpio === '' || isNaN(Number(limpio))) {
        return 'Sin dato';
    }

    let numero = Number(limpio);

    if (numero <= 1) {
        numero = numero * 100;
    }

    return numero.toFixed(2) + '%';
}

function colorPorRiesgo(riesgo) {
    const valor = limpiarTexto(riesgo).toLowerCase();

    if (valor.includes('alto')) {
        return '#ef4444';
    }

    if (valor.includes('medio')) {
        return '#f97316';
    }

    if (valor.includes('bajo')) {
        return '#22c55e';
    }

    return '#9ca3af';
}

function claseBadgeRiesgo(riesgo) {
    const valor = limpiarTexto(riesgo).toLowerCase();

    if (valor.includes('alto')) {
        return 'badge-riesgo badge-alto';
    }

    if (valor.includes('medio')) {
        return 'badge-riesgo badge-medio';
    }

    if (valor.includes('bajo')) {
        return 'badge-riesgo badge-bajo';
    }

    return 'badge-riesgo badge-sin-dato';
}

function estiloParroquia(feature) {
    const props = feature.properties || {};
    const riesgo = limpiarTexto(props.riesgo_predicho);

    return {
        color: '#ffffff',
        weight: 1,
        fillColor: colorPorRiesgo(riesgo),
        fillOpacity: 0.75
    };
}

function contenidoHover(props) {
    const parroquia = limpiarTexto(props.parroquia) || 'Parroquia sin nombre';
    const canton = limpiarTexto(props.canton) || 'Sin cantón';
    const provincia = limpiarTexto(props.provincia || props.provincia_modelo) || 'Sin provincia';

    return `
        <h4>${parroquia}</h4>
        <p><strong>Cantón:</strong> ${canton}</p>
        <p><strong>Provincia:</strong> ${provincia}</p>
        <p><em>Haga clic para ver el riesgo predicho.</em></p>
    `;
}

function contenidoPanelClick(props) {
    const parroquia = limpiarTexto(props.parroquia) || 'Parroquia sin nombre';
    const canton = limpiarTexto(props.canton) || 'Sin cantón';
    const provincia = limpiarTexto(props.provincia || props.provincia_modelo) || 'Sin provincia';

    const riesgo = limpiarTexto(props.riesgo_predicho) || 'Sin dato';
    const certeza = formatoPorcentaje(props.confianza_prediccion);

    const anchoBarra = certeza === 'Sin dato' ? '0%' : certeza;
    const color = colorPorRiesgo(riesgo);

    return `
        <h4>${parroquia}</h4>
        <p><strong>Cantón:</strong> ${canton}</p>
        <p><strong>Provincia:</strong> ${provincia}</p>
        <hr>
        <div class="panel-riesgo-row">
            <span>Riesgo predicho:</span>
            <strong class="${claseBadgeRiesgo(riesgo)}">${riesgo}</strong>
        </div>
        <div class="panel-riesgo-row">
            <span>Certeza:</span>
            <strong>${certeza}</strong>
        </div>
        <div class="popup-bar">
            <div style="width:${anchoBarra}; background:${color};"></div>
        </div>
        <p class="popup-note">Información basada en la categoría de riesgo representada por el color del mapa.</p>
    `;
}

function contenidoPopup(props) {
    const parroquia = limpiarTexto(props.parroquia) || 'Parroquia sin nombre';
    const canton = limpiarTexto(props.canton) || 'Sin cantón';
    const provincia = limpiarTexto(props.provincia || props.provincia_modelo) || 'Sin provincia';

    const riesgo = limpiarTexto(props.riesgo_predicho) || 'Sin dato';
    const certeza = formatoPorcentaje(props.confianza_prediccion);

    const anchoBarra = certeza === 'Sin dato' ? '0%' : certeza;
    const color = colorPorRiesgo(riesgo);

    return `
        <div class="popup-simple-riesgo">
            <div class="popup-simple-header">
                <h3>${parroquia}</h3>
                <p>${canton} · ${provincia}</p>
            </div>

            <div class="popup-simple-body">
                <div class="popup-row">
                    <span>Riesgo predicho:</span>
                    <strong class="${claseBadgeRiesgo(riesgo)}">${riesgo}</strong>
                </div>

                <div class="popup-row">
                    <span>Certeza de la categoría:</span>
                    <strong>${certeza}</strong>
                </div>

                <div class="popup-bar">
                    <div style="width:${anchoBarra}; background:${color};"></div>
                </div>

                <p class="popup-note">
                    Información basada en la categoría de riesgo representada por el color del mapa.
                </p>
            </div>
        </div>
    `;
}

const map = L.map('map').setView([-1.8312, -78.1834], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let capaParroquias = null;

const infoPanel = L.control({
    position: 'topright'
});

infoPanel.onAdd = function() {
    this._div = L.DomUtil.create('div', 'info-hover');
    this.update();
    return this._div;
};

infoPanel.update = function(props, modo) {
    if (!props) {
        this._div.innerHTML = `
            <h4>Información de Ubicación</h4>
            <p>Pase el cursor sobre una parroquia.</p>
        `;
        return;
    }

    if (modo === 'click') {
        this._div.innerHTML = contenidoPanelClick(props);
    } else {
        this._div.innerHTML = contenidoHover(props);
    }
};

infoPanel.addTo(map);

fetch('/api/geojson')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (!data.features || data.features.length === 0) {
            console.warn('El GeoJSON no contiene parroquias.');
            return;
        }

        capaParroquias = L.geoJSON(data, {
            style: estiloParroquia,
            interactive: true,

            onEachFeature: function(feature, layer) {
                const props = feature.properties || {};

                layer.on({
                    mouseover: function() {
                        infoPanel.update(props, 'hover');
                    },

                    mouseout: function() {
                        infoPanel.update();
                    },

                    click: function(e) {
                        infoPanel.update(props, 'click');

                        L.popup({
                            maxWidth: 330,
                            minWidth: 280,
                            closeButton: true,
                            autoClose: true,
                            closeOnClick: true,
                            autoPan: true,
                            keepInView: true,
                            className: 'popup-leaflet-simple'
                        })
                        .setLatLng(e.latlng)
                        .setContent(contenidoPopup(props))
                        .openOn(map);
                    }
                });
            }
        }).addTo(map);

        map.fitBounds(capaParroquias.getBounds(), {
            padding: [20, 20]
        });
    })
    .catch(function(error) {
        console.error('No se pudo cargar el GeoJSON:', error);
    });

const leyenda = L.control({
    position: 'bottomright'
});

leyenda.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend leaflet-legend');

    div.innerHTML = `
        <h4>Simbología</h4>
        <div><i class="legend-high"></i> Riesgo Alto</div>
        <div><i class="legend-medium"></i> Riesgo Medio</div>
        <div><i class="legend-low"></i> Riesgo Bajo</div>
    `;

    return div;
};

leyenda.addTo(map);
