const LogModel = {

    async registrar(accion, descripcion, usuarioId = null, metadata = {}) {
        try {

            const log = {
                tabla:     metadata?.tabla || '',
                accion:    accion,
                usuario_id: usuarioId,
                mensaje:   descripcion,
                timestamp: new Date().toISOString()
            };

            await window.db.auditoria.add(log);

            return true;

        } catch (err) {
            console.error("Error registrando log", err);
            return false;
        }
    }

};

window.LogModel = LogModel;