let ioInstance = null;

const newSensorBuffer = {};

function initSocketIO(io) {
    ioInstance = io;

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-user-room", (userId) => {
            socket.join(`user:${userId}`);
            console.log(`Socket ${socket.id} joined room user:${userId}`);
        });

        socket.on("client-ready", (userId) => {
            const message = newSensorBuffer[userId];
            if (message) {
                console.log(`[Socket] Emitting buffered NEW_SENSOR for user ${userId}`);
                io.to(`user:${userId}`).emit(message.type, message);
                delete newSensorBuffer[userId];
            } else {
                console.log(`[Socket] No buffered event for user ${userId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
}

function notifyClients(userId, message) {
    if (!ioInstance) return;
    ioInstance.to(`user:${userId}`).emit(message.type, message);
}

function setPendingSensor(userId, message) {
    console.log(`[Buffer] NEW_SENSOR buffered for user ${userId}`);
    newSensorBuffer[userId] = message;
}

module.exports = {
    initSocketIO,
    notifyClients,
    setPendingSensor,
};
