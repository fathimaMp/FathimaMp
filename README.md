name: Process Avatar

on:
  push:
    paths:
      - "raw_assets/avatar_original.png"
      - "scripts/process_avatar.py"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - name: Install Pillow
        run: python -m pip install --upgrade pip pillow
      - name: Process avatar
        run: python scripts/process_avatar.py
      - name: Commit processed avatar
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add assets/avatar.png
          git commit -m "Auto: process avatar" || echo "No changes to commit"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}


### 🚀 Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) 
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=for-the-badge)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github)

---

### 📊 GitHub Stats

![C2's GitHub stats](https://github-readme-stats.vercel.app/api?username=fathimamp&show_icons=true&theme=tokyonight)

![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=fathimamp&layout=compact&theme=tokyonight)

---

### 🔗 Connect with Me

[![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/fathima-mp)
[![Portfolio](https://img.shields.io/badge/My_Portfolio-Click_Here-orange?style=for-the-badge)](https://fathimamp.github.io/personal_website/)

---
