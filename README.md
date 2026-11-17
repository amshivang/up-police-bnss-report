<div align="center">

  <p>
    <a href="https://github.com/amshivang"><strong>Shivang Shukla (@amshivang)</strong></a> • 
    <a href="https://github.com/amshivang?tab=repositories">Portfolio Repositories</a> • 
    <a href="mailto:linkwithshivang@gmail.com">Contact</a>
  </p>

  # 🚨 UP Police — BNSS 126/135 Chalani Report Generator
  ### उत्तर प्रदेश पुलिस • धारा 126/135 BNSS डिजिटल चलानी रिपोर्ट एवं अभिलेख प्रणाली

  <p>
    <em>A 100% offline, privacy-first Progressive Web Application (PWA) engineered for Uttar Pradesh Police officers to generate court-admissible preventive action reports under Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.</em>
  </p>

  <p>
    <a href="https://amshivang.github.io/up-police-bnss-report/"><img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0284C7?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo"/></a>
    <a href="#"><img src="https://img.shields.io/badge/Jurisdiction-Uttar%20Pradesh%20Police-C2410C?style=for-the-badge&logo=shield&logoColor=white" alt="Jurisdiction"/></a>
    <a href="#"><img src="https://img.shields.io/badge/BNSS-Sections%20126%20%2F%20135-1E293B?style=for-the-badge" alt="BNSS Act"/></a>
    <a href="#"><img src="https://img.shields.io/badge/Architecture-100%25%20Offline%20PWA-059669?style=for-the-badge&logo=pwa&logoColor=white" alt="Offline PWA"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-EAB308?style=for-the-badge" alt="License: MIT"/></a>
  </p>

  <p>
    <a href="#-overview">Overview</a> •
    <a href="#-legal-framework-bnss-vs-crpc">Legal Framework</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-architecture--tech-stack">Tech Stack</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-repository-structure">Structure</a> •
    <a href="#-data-privacy--forensic-standards">Privacy & Integrity</a> •
    <a href="#-author--connect">Author</a>
  </p>

</div>

---

## 📌 Overview

With the enactment of the **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** replacing the colonial Code of Criminal Procedure (CrPC), 1973, law enforcement officers across India transitioned to new legal provisions for preventive policing and maintenance of public peace.

In Uttar Pradesh, police stations routinely execute preventive actions under Sections 126 and 135 BNSS against antisocial elements and dispute parties. Traditionally, these reports were either hand-written on non-standard paper or manually typed without standardized legal formatting, causing judicial friction in Executive Magistrate courts.

**UP Police BNSS Chalani Report Generator** is an offline-ready, bilingual digital application that standardizes, formats, validates, and renders official court-ready chalani dossiers complete with the Uttar Pradesh State Seal, UP Police insignia, Devanagari typography, and verifiable record management.

🌐 **Production Web Application:** [https://amshivang.github.io/up-police-bnss-report/](https://amshivang.github.io/up-police-bnss-report/)

---

## ⚖️ Legal Framework (BNSS vs. CrPC)

| New Act (BNSS 2023) | Old Code (CrPC 1973) | Legal Purpose & Scope |
| :--- | :--- | :--- |
| **Section 126 BNSS** | Section 107 CrPC | Security for keeping peace in other cases (preventive proceedings when breach of peace or disturbance of public tranquility is apprehended). |
| **Section 135 BNSS** | Section 116 CrPC | Order to give security & interim bail bond execution during the inquiry process. |

The application automatically structures the report with appropriate statutory citations, magistrate addressing blocks, and formal legal language in Devanagari Hindi.

---

## ✨ Key Features

- **🛡️ 100% Client-Side Air-Gapped Operation**: No case data, suspect name, or officer identity ever leaves the browser. Zero server-side persistence ensures complete operational privacy for sensitive policing data.
- **📄 Instant Bilingual Court-Ready PDF Export**: Generates perfectly styled A4 dossiers matching Uttar Pradesh Police administrative standards, with embedded vector insignia, seals, and signature fields.
- **📱 PWA & Offline Service Worker**: Installable as a native standalone app on Windows, macOS, Android, and iOS devices. Functions completely without internet after the initial visit.
- **💾 Local Record Storage (IndexedDB / LocalStorage)**: Automatically autosaves drafted reports locally, allowing officers to review past records (`पूर्व रिपोर्ट्स`), reload drafts, or edit prior submissions.
- **✍️ Hindi (Devanagari) & English Input Support**: Custom styled with `Noto Sans Devanagari` and `Inter` typography for crisp, legible official legal documents.
- **🗂️ Pre-Configured Police Templates**: Dropdown and preset selections for standard offences (land disputes, festival sensitivity, election security, group altercations, antisocial threats).

---

## 🛠️ Architecture & Tech Stack

| Component / Layer | Technology | Version | Architectural Role & Rationale |
| :--- | :--- | :--- | :--- |
| **Core UI Engine** | Vanilla JavaScript | ES2022 | Lightweight, zero-dependency client-side application logic |
| **Styling & Theme** | CSS3 Modern Grid/Flex | Custom | UP Police Khaki & Navy palette (`#002147`) with dedicated `@media print` rules |
| **Typography** | Noto Sans Devanagari & Inter | Google Fonts / Offline | Crystal-clear official legal script rendering for Hindi judicial documents |
| **PWA & Offline** | Web Service Worker | Cache API | Full offline caching of scripts, stylesheets, and embedded vector assets |
| **PDF Rendering** | html2pdf.js / jsPDF | Bundled | Direct in-browser rasterization of DOM templates into printable PDF files |
| **Local Dev Server**| Python HTTP Server | 3.x | Lightweight socket server for local desktop launching via `start.bat` |
| **Deployment** | GitHub Actions / Pages | CI/CD | Automated zero-downtime deployment pipeline |

---

## 🚀 Quick Start

### Option 1: Access Directly in Browser (No Setup)
Simply open the hosted portal in any browser:
👉 **[https://amshivang.github.io/up-police-bnss-report/](https://amshivang.github.io/up-police-bnss-report/)**

### Option 2: Run Locally (Air-Gapped Workstations)
For high-security, network-isolated police station terminals:

```bash
# 1. Clone repository
git clone https://github.com/amshivang/up-police-bnss-report.git
cd up-police-bnss-report

# 2. Run on Windows (Double-click or terminal):
start.bat
# Or run with Python:
python server.py
```
The server will automatically launch your default browser at `http://localhost:8080`.

---

## 📂 Repository Structure

```
up-police-bnss-report/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── assets/
│   ├── libs/
│   │   └── html2pdf.bundle.min.js  # Offline bundled PDF compilation library
│   ├── up_police_flag.svg          # Official Uttar Pradesh Police flag
│   ├── up_police_logo.png          # High-resolution UP Police emblem
│   ├── up_police_logo_512.png      # PWA app icon
│   └── up_seal.svg                 # Government of Uttar Pradesh State Seal
├── app.css                         # Application stylesheet and print styles
├── app.js                          # Core application logic, validation & storage
├── index.html                      # Bilingual reporting portal interface
├── manifest.json                   # Progressive Web App manifest
├── server.py                       # Zero-dependency local Python HTTP server
├── start.bat                       # One-click Windows desktop launcher
├── sw.js                           # Offline caching Service Worker
├── test.js                         # Automated input validation test suite
├── LICENSE                         # MIT License
└── README.md                       # Comprehensive documentation
```

---

## 🔒 Data Privacy & Forensic Standards

- **Zero Remote Storage**: All personal details (names, Aadhaar/ID, residential addresses, allegations) reside solely in the user's browser sandbox.
- **No Analytics / Telemetry**: Absolutely no Google Analytics, third-party cookies, tracking beacons, or telemetry scripts are included.
- **Tamper-Evident Layout**: Standardized margin bounding, sequential numbering, and official stamp positions prevent page alterations when presented before an Executive Magistrate.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 👤 Author & Connect

<div align="center">
  <p><strong>Shivang Shukla</strong></p>
  <p><em>Cybersecurity & Digital Forensics Scholar</em></p>

  <p>
    <a href="https://github.com/amshivang"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/></a>
    <a href="https://www.linkedin.com/in/amshivang/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    <a href="mailto:linkwithshivang@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/></a>
  </p>

  <a href="https://buymeacoffee.com/amshivang">
    <img src="https://raw.githubusercontent.com/amshivang/amshivang/main/qr-code.png" alt="Buy Me A Coffee" width="180">
  </a>
  <br>
  <strong><a href="https://buymeacoffee.com/amshivang">☕ Support my open-source work on Buy Me A Coffee!</a></strong>
</div>
