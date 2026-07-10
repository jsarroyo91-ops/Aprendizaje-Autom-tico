function normalizarTexto(valor) {
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

function formatoProbabilidad(valor) {
    const limpio = normalizarTexto(valor);

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
    const valor = normalizarTexto(riesgo).toLowerCase();

    if (valor.includes('alto')) {
        return '#dc2626';
    }

    if (valor.includes('medio')) {
        return '#d97706';
    }

    if (valor.includes('bajo')) {
        return '#16a34a';
    }

    return '#868e96';
}

function claseRiesgo(riesgo) {
    const valor = normalizarTexto(riesgo).toLowerCase();

    if (valor.includes('alto')) {
        return 'popup-badge riesgo-alto';
    }

    if (valor.includes('medio')) {
        return 'popup-badge riesgo-medio';
    }

    if (valor.includes('bajo')) {
        return 'popup-badge riesgo-bajo';
    }

    return 'popup-badge riesgo-sin-dato';
}

function estiloFeature(feature) {
    const props = feature.properties || {};
    const riesgo = normalizarTexto(props.riesgo_predicho);

    return {
        color: '#ffffff',
        weight: 1,
        fillColor: colorPorRiesgo(riesgo),
        fillOpacity: 0.72
    };
}

function estiloHover(layer) {
    layer.setStyle({
        weight: 2,
        color: '#111827',
        fillOpacity: 0.86
    });

    layer.bringToFront();
}

function contenidoPopupSimple(properties) {
    const parroquia = normalizarTexto(properties.parroquia) || 'Parroquia sin nombre';
    const canton = normalizarTexto(properties.canton) || 'Sin cantón';
    const provincia = normalizarTexto(properties.provincia || properties.provincia_modelo) || 'Sin provincia';
    const riesgoPredicho = normalizarTexto(properties.riesgo_predicho) || 'Sin dato';
    const confianza = formatoProbabilidad(properties.confianza_prediccion);

    return `
        <div class="popup-simple-riesgo">
            <div class="popup-simple-header">
                <h3>${parroquia}</h3>
                <p>${canton} · ${provincia}</p>
            </div>

            <div class="popup-simple-body">
                <div class="popup-row">
                    <span>Riesgo predicho:</span>
                    <strong class="${claseRiesgo(riesgoPredicho)}">${riesgoPredicho}</strong>
                </div>

                <div class="popup-row">
                    <span>Certeza de la categoría:</span>
                    <strong>${confianza}</strong>
                </div>

                <div class="popup-bar">
                    <div style="width:${confianza === 'Sin dato' ? '0' : confianza}; background:${colorPorRiesgo(riesgoPredicho)};"></div>
                </div>

                <p class="popup-note">Información basada en la categoría de riesgo representada por el color del mapa.</p>
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

const infoHover = L.control({
    position: 'topright'
});

infoHover.onAdd = function() {
    this._div = L.DomUtil.create('div', 'info-hover');
    this.update();
    return this._div;
};

infoHover.update = function(properties) {
    if (!properties) {
        this._div.innerHTML = `
            <h4>Información de Ubicación</h4>
            <p>Pase el cursor sobre una parroquia.</p>
        `;
        return;
    }

    const parroquia = normalizarTexto(properties.parroquia) || 'Parroquia sin nombre';
    const canton = normalizarTexto(properties.canton) || 'Sin cantón';
    const provincia = normalizarTexto(properties.provincia || properties.provincia_modelo) || 'Sin provincia';

    this._div.innerHTML = `
        <h4>${parroquia}</h4>
        <p><strong>Cantón:</strong> ${canton}</p>
        <p><strong>Provincia:</strong> ${provincia}</p>
    `;
};

infoHover.addTo(map);

fetch('/api/geojson')
    .then(response => response.json())
    .then(data => {
        if (!data.features || data.features.length === 0) {
            console.warn('El GeoJSON no contiene parroquias.');
            return;
        }

        capaParroquias = L.geoJSON(data, {
            style: estiloFeature,
            onEachFeature: function(feature, layer) {
                const properties = feature.properties || {};

                layer.on({
                    mouseover: function(e) {
                        estiloHover(e.target);
                        infoHover.update(properties);
                    },

                    mouseout: function(e) {
                        if (capaParroquias) {
                            capaParroquias.resetStyle(e.target);
                        }
                        infoHover.update();
                    },

                    click: function(e) {
                        if (capaParroquias) {
                            capaParroquias.resetStyle(e.target);
                        }

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
                        .setContent(contenidoPopupSimple(properties))
                        .openOn(map);
                    }
                });
            }
        }).addTo(map);

        map.fitBounds(capaParroquias.getBounds(), {
            padding: [20, 20]
        });
    })
    .catch(error => {
        console.error('No se pudo cargar el GeoJSON:', error);
    });

const leyenda = L.control({
    position: 'bottomright'
});

leyenda.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend leaflet-legend');

    div.innerHTML = `
        <h4>Simbología</h4>
        <div><i class="legend-high"></i> Riesgo alto</div>
        <div><i class="legend-medium"></i> Riesgo medio</div>
        <div><i class="legend-low"></i> Riesgo bajo</div>
        <div><i class="legend-none"></i> Sin dato</div>
    `;

    return div;
};

leyenda.addTo(map);
