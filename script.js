document.querySelector('.btn-S').addEventListener('click', function() {
    const phoneModel = document.getElementById('phoneType').value.toLowerCase().trim();
    const fileInput = document.querySelector('input[type="file"]');
    
    if (!fileInput.files[0]) return alert("يرجى اختيار صورة أولاً");
    if (!phoneModel) return alert("يرجى إدخال موديل الهاتف");

    // إظهار اللودينج
    const loading = document.querySelector('.loading');
    if (loading) loading.style.display = 'block';

    const canvas = document.createElement('canvas');
    canvas.width = 400; // عرض الجراب الثابت
    canvas.height = 800; // طول الجراب الثابت
    const ctx = canvas.getContext('2d');

    const image = new Image();
    image.src = URL.createObjectURL(fileInput.files[0]);

    image.onload = function() {
        // 1. تنظيف وتجهيز القالب (شكل الموبايل)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.roundRect(10, 10, 380, 780, 50); // رسم حدود الجراب
        ctx.clip(); // قص أي شيء خارج هذا الإطار

        // 2. رسم الصورة مع الحفاظ على التناسب (Center Crop)
        const imgRatio = image.width / image.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
            drawHeight = canvas.height;
            drawWidth = image.width * (canvas.height / image.height);
            offsetX = -(drawWidth - canvas.width) / 2;
            offsetY = 0;
        } else {
            drawWidth = canvas.width;
            drawHeight = image.height * (canvas.width / image.width);
            offsetX = 0;
            offsetY = -(drawHeight - canvas.height) / 2;
        }
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        // 3. جلب البيانات وتفريغ فتحة الكاميرا
        fetch('./data.json')
            .then(response => response.json())
            .then(data => {
                let targetModel = null;
                
                // البحث عن الموديل داخل هيكل الـ JSON الخاص بك
                for (const category of data.types) {
                    const found = category.brands.find(b => b.name.toLowerCase() === phoneModel);
                    if (found) {
                        targetModel = found;
                        break;
                    }
                }

                if (targetModel) {
                    const cam = targetModel.cameraPosition;
                    // تفعيل وضع "المسح" لتفريغ مكان الكاميرا
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.beginPath();
                    ctx.roundRect(cam.x, cam.y, cam.width, cam.height, cam.radius);
                    ctx.fill();
                } else {
                    console.warn("الموديل غير موجود، سيتم الرسم بدون فتحة كاميرا");
                }

                // 4. إضافة الإطار الخارجي (Border)
                ctx.globalCompositeOperation = 'source-over';
                ctx.beginPath();
                ctx.roundRect(10, 10, 380, 780, 50);
                ctx.lineWidth = 15;
                ctx.strokeStyle = '#1a1a1a'; // لون إطار الجراب
                ctx.stroke();

                // 5. عرض النتيجة النهائية
                displayResult(canvas, phoneModel);
                
                if (loading) loading.style.display = 'none';
                document.querySelector('.cont').style.display = 'none';
                
                // تنظيف الذاكرة
                URL.revokeObjectURL(image.src);
            })
            .catch(err => {
                console.error("خطأ في جلب البيانات:", err);
                if (loading) loading.style.display = 'none';
            });
    };
});

function displayResult(canvas, modelName) {
    const resultContainer = document.createElement('div');
    resultContainer.className = 'card-container';
    resultContainer.style.textAlign = 'center';
    resultContainer.style.marginTop = '20px';

    // تصغير العرض للعرض فقط في المتصفح
    canvas.style.width = '200px';
    canvas.style.borderRadius = '30px';
    canvas.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
    
    const downloadBtn = document.createElement('a');
    downloadBtn.href = canvas.toDataURL('image/png');
    downloadBtn.download = `case-${modelName}.png`;
    downloadBtn.innerHTML = `تحميل جراب ${modelName.toUpperCase()}`;
    downloadBtn.style.display = 'block';
    downloadBtn.style.marginTop = '15px';
    downloadBtn.style.padding = '10px';
    downloadBtn.style.backgroundColor = '#222';
    downloadBtn.style.color = '#fff';
    downloadBtn.style.textDecoration = 'none';
    downloadBtn.style.borderRadius = '8px';

    resultContainer.appendChild(canvas);
    resultContainer.appendChild(downloadBtn);
    document.body.appendChild(resultContainer);
}
