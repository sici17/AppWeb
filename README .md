# 📚 LibSphere — Software Engineering Web Platform

A full-stack web application designed for library resource management, membership card issuing, loans tracking, and digital document export.

> **Academic Note:** Developed as part of the **3rd Year Software Engineering & Web Platforms Course** for the **Bachelor’s Degree in Computer Science**.

---

## 📌 Project Overview

**LibSphere (SE Web Platform)** is an enterprise-grade digital library management system. The platform offers a complete solution for digital loans, store catalog management, order processing, and user access control using modern web architecture (Angular Single Page Application + Spring Boot REST APIs + Keycloak IAM).

Additionally, it incorporates an extensible document processing engine (`textdoc`) demonstrating architectural design patterns (Composite, Visitor, Builder) for rendering documents into Plain Text, HTML, LaTeX, and JSON.

---

## ✨ Features

- **User Authentication & Authorization (IAM):** Keycloak JWT-based OAuth2 authentication, dynamic user roles (Admin vs User), and secure route guards.
- **Library Resource & Loan Management:** Reserve resources, manage active loans, track return deadlines, and issue library membership cards (`TesseraLibreria`).
- **Store & Cart Management:** Browse articles, manage persistent shopping carts, and execute order checkout workflows.
- **Admin Dashboard:** Administrative controls for user management, resource catalog updates, and order/loan tracking.
- **Multi-Format Document Processing Subsystem (`textdoc`):** Parse, manipulate, and export structured documents to HTML, LaTeX, JSON, and Plain Text formats.

---

## 🛠️ Architecture & Tech Stack

### 🔹 Frontend (Angular SPA)
- **Framework:** Angular 17+ (TypeScript, RxJS, Angular Router, HTTP Interceptors)
- **Authentication:** Keycloak JS client, Auth Interceptors, and Role-Based Guards
- **UI & Layout:** Modular component structure (`admin-dashboard`, `user-dashboard`, `risorse`, `tessere`, `login`, `registration`)

### 🔹 Backend (Spring Boot REST Service)
- **Framework:** Java 17 / Spring Boot, Spring Security (OAuth2 Resource Server with JWT conversion), Spring Data JPA
- **Controllers & APIs:** REST endpoints for `Utenti`, `Risorsa`, `Prestito`, `TesseraLibreria`, `Cart`, `Ordine`
- **Security:** Integrated Keycloak user service API for user registration and JWT token validation

### 🔹 Document Engine Subsystem (`textdoc`)
Demonstrates classical Gang of Four (GoF) design patterns:
- **Composite Pattern:** `CompositeDocumentElement`, `Section`, `SubSection`, `Paragraph`
- **Visitor Pattern:** `TextDocumentVisitor`, `HtmlTextVisitor`, `PlainTextVisitor`, `RemoveSubSectionVisitor`
- **Builder Pattern:** `DocumentBuilder`, `HTMLTextBuilder`, `LaTeXTextBuilder`, `JsonTextBuilder`

---

## 📁 Repository Structure

```text
.
├── FrontEnd/                   # Angular Single Page Application
│   ├── src/app/
│   │   ├── components/         # Feature components (Dashboard, Login, Resources, Cards)
│   │   ├── guards/             # Auth Route Guards
│   │   ├── interceptors/       # JWT Token HTTP Interceptor
│   │   └── services/           # ApiService, AuthService
│   ├── tsconfig.json
│   └── package.json
├── backend/                    # Spring Boot REST API Service
│   └── src/main/java/
│       ├── controller/         # REST Controllers
│       ├── entities/           # JPA Domain Entities
│       ├── repositories/       # Spring Data JPA Repositories
│       ├── services/           # Business Logic Services
│       └── support/            # Auth Security Config, Keycloak API, Custom Exceptions
├── textdoc/                    # Document Processing Engine & GoF Design Patterns
│   ├── builder/                # Document Builders (HTML, LaTeX, JSON, Text)
│   ├── parser/                 # Text Document Parser
│   └── visitor/                # Document Structure Visitors
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) & **Angular CLI**
- **JDK 17** or higher & **Maven**
- Running **Keycloak Server** instance configured with OAuth2 Client Realm

---

### 1️⃣ Running the Backend (Spring Boot)

```bash
cd backend

# Build and run the Spring Boot service
mvn spring-boot:run
```
*The server will start on `http://localhost:8080` (configured in `application.properties`).*

---

### 2️⃣ Running the Frontend (Angular)

```bash
cd FrontEnd

# Install dependencies
npm install

# Start development server
ng serve
```
*Navigate to `http://localhost:4200` in your browser.*

---

## 📄 License

This project was developed for academic purposes as part of the **3rd Year Bachelor's Degree in Computer Science (Software Engineering & Web Platforms Course)**.
