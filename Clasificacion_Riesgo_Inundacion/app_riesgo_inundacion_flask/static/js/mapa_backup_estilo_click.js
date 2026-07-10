function normalizarTexto(valor) {
    return String(valor || '').trim();
}

function formatoProbabilidad(valor) {
    if (valor === null || valor === undefined || valor === '' || isNaN(Number(valor))) {
        return 'Sin dato';
    }

    let numero = Number(valor);

    if (numero <= 1) {
        numero = numero * 100;
    }

    return numero.toFixed(2) + '%';
}

function colorPorRiesgo(riesgo) {
    const valor = String(riesgo || '').toLowerCase();

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

function estiloFeature(feature) {
    const riesgo = feature.properties?.riesgo_predicho || 'Sin dato';

    return {
        color: '#ffffff',
        weight: 1,
        fillColor: colorPorRiesgo(riesgo),
        fillOpacity: 0.72
    };
}

function estiloHover(layer) {
    layer.setStyle({
        weight: 3,
        color: '#111827',
        fillOpacity: 0.88
    });

    layer.bringToFront();
}

function contenidoPopup(properties) {
    const parroquia = normalizarTexto(properties.parroquia) || 'Parroquia sin nombre';
    const canton = normalizarTexto(properties.canton) || 'Sin cantón';
    const provincia = normalizarTexto(properties.provincia || properties.provincia_modelo) || 'Sin provincia';
    const codigo = normalizarTexto(properties.codigo_parroquia) || 'Sin código';

    const riesgoPredicho = normalizarTexto(properties.riesgo_predicho) || 'Sin dato';
    const riesgoReal = normalizarTexto(properties.riesgo_real || properties.riesgo_inundacion) || 'Sin dato';

    const score = formatoProbabilidad(properties.confianza_prediccion);
    const probBajo = formatoProbabilidad(properties.probabilidad_bajo);
    const probMedio = formatoProbabilidad(properties.probabilidad_medio);
    const probAlto = formatoProbabilidad(properties.probabilidad_alto);

    return `
        <div class="popup-riesgo">
            <h3>${parroquia}</h3>
            <p><strong>Código parroquial:</strong> ${codigo}</p>
            <p><strong>Cantón:</strong> ${canton}</p>
            <p><strong>Provincia:</strong> ${provincia}</p>
            <hr>
            <p><strong>Categoría de riesgo de inundación:</strong> ${riesgoPredicho}</p>
            <p><strong>Score / confianza del modelo:</strong> ${score}</p>
            <p><strong>Probabilidad riesgo bajo:</strong> ${probBajo}</p>
            <p><strong>Probabilidad riesgo medio:</strong> ${probMedio}</p>
            <p><strong>Probabilidad riesgo alto:</strong> ${probAlto}</p>
            <p><strong>Riesgo histórico registrado:</strong> ${riesgoReal}</p>
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
                        if (e.originalEvent) {
                            L.DomEvent.stopPropagation(e.originalEvent);
                        }

                        const contenido = contenidoPopup(properties);

                        L.popup({
                            maxWidth: 390,
                            minWidth: 270,
                            closeButton: true,
                            autoClose: true,
                            closeOnClick: true,
                            autoPan: true,
                            keepInView: true
                        })
                        .setLatLng(e.latlng)
                        .setContent(contenido)
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
