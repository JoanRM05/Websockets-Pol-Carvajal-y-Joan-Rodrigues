# 📦 Chat en tiempo real + Documento colaborativo + Gestion de archivos

Esta aplicación permite la comunicación en tiempo real a través de salas de chat, la creación de documentos colaborativos entre usuarios y la posibilidad de consultar y descargar el historial tanto de las conversaciones como de los documentos generados. Es una herramienta ideal para equipos que necesitan colaborar de forma ágil, centralizada y eficiente.

---

## 📚 Índice

- [🔧 Funcionalidades](#-funcionalidades)
- [🧪 Tecnologías](#-tecnologías)
- [📂 Clonar el proyecto](#-clonar-el-proyecto)
- [🚀 Instalación de dependencias](#-instalación-de-dependencias)
- [▶️ Iniciar Cliente](#️-iniciar-cliente)
- [🖥️ Iniciar Servidor](#️-iniciar-servidor)
- [🎓 Aprendizajes adquiridos](#-aprendizajes-adquiridos)

---

## 🔧 Funcionalidades

Lista de funcionalidades implementadas en el proyecto:

- [ ] Registro y acceso: inicio de sesión con validación
- [ ] Mensajería en tiempo real: uso de WebSockets para sincronizar mensajes
- [ ] Compartición de archivos: subida y descarga dentro de la sala
- [ ] Historial descargable: exportación en .txt o .json
- [ ] Documento colaborativo integrado: creación y edición simultánea por parte de la pareja, sincronizado en tiempo real

---

## 🧪 Tecnologías

Tecnologías y herramientas utilizadas en este proyecto:

- Frontend: React
- Backend: Node.js + Express
- Base de datos: JSON
- AJAX: Axios

---

## 📂 Clonar el proyecto

Usa el siguiente comando para clonar este repositorio:

```bash
git clone https://github.com/JoanRM05/Websockets-Pol-Carvajal-y-Joan-Rodrigues.git
```

---

## 🚀 Instalación de dependencias

Instalar dependencias del cliente:

```bash
cd .\front\client\
npm install
```

Instalar dependencias del servidor

```bash
cd ..\..\back\server\
npm install
```

Volver al punto de partida

```bash
cd ..\..\
```

---

## ▶️ Iniciar Cliente

Pasos para iniciar la parte del cliente:

⚠️ Importante: el cliente y el servidor deben iniciarse en terminales separadas.

```bash
cd .\front\client\
npm run dev
```

---

## 🖥️ Iniciar Servidor

Pasos para iniciar la parte del servidor:

⚠️ Importante: asegúrate de tener otra terminal abierta para el servidor.

```bash
cd .\back\server\
node index.js
```

---

## 🎓 Aprendizajes adquiridos

Durante la realización de esta práctica, hemos trabajado y consolidado una serie de conocimientos clave tanto del frontend como del backend. En concreto, hemos aprendido a:

- Comprender la diferencia entre AJAX y WebSockets

- Diseñar y consumir APIs REST

- Implementar funcionalidades en tiempo real

- Sincronizar acciones y contenidos entre varios usuarios

- Aplicar de forma práctica los conocimientos de frontend y backend mediante una aplicación funcional

---
