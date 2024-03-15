FROM nginx:1.18
COPY index.html /usr/share/nginx/html
COPY index.js /usr/share/nginx/js
COPY gl-matrix-min.js /usr/share/nginx/js
COPY graphics.js /usr/share/nginx/js
COPY logic.js /usr/share/nginx/js
COPY style.css /usr/share/nginx/css
COPY favicon.png /usr/share/nginx/images
