import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { productAPI, variantAPI } from '../services/api';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

const SHAPE_CONFIGS = {
  slim:    { scaleX: 0.92, label: 'Slim',    color: '#dbeafe', textColor: '#1e40af' },
  regular: { scaleX: 1,    label: 'Regular', color: '#dcfce7', textColor: '#166534' },
  plus:    { scaleX: 1.12, label: 'Plus',    color: '#fce7f3', textColor: '#9d174d' },
};

const GENDER_CONFIGS = {
  female: { label: 'Female', icon: '👩', image: '/models/female.png', modelWidth: 0.68, yOffset: 16 },
  male: {
    label: 'Male',
    icon: '👨',
    image: '/models/male.png',
    modelWidth: 0.64,
    yOffset: 10,
    sourceCrop: { x: 1340, y: 80, w: 1320, h: 3820 },
  },
};

const CANVAS_W = 400;
const CANVAS_H = 600;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getGarmentType = (product) => {
  const text = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
  if (/(dress|gown|kurti|saree)/.test(text)) return 'dress';
  if (/(pant|pants|jean|jeans|trouser|trousers|bottom|shorts|jogger|cargo)/.test(text)) return 'bottom';
  if (/(jacket|coat|blazer|cardigan)/.test(text)) return 'jacket';
  return 'top';
};

const getResponseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const normalizeText = (value) => `${value || ''}`.toLowerCase();

const inferGender = (item) => {
  const text = normalizeText(`${item?.name} ${item?.category} ${item?.description}`);
  if (/(women|woman|female|ladies|girl|girls)/.test(text)) return 'female';
  if (/(men|man|male|boys|boy)/.test(text)) return 'male';
  return 'unisex';
};

const getFirstUsableVariant = (item) => {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  return variants.find((v) => v?.active !== false && v?.stockQuantity !== 0 && v?.imageUrl)
    || variants.find((v) => v?.active !== false && v?.stockQuantity !== 0)
    || variants[0]
    || null;
};

const isBottomProduct = (item) => getGarmentType(item) === 'bottom';
const isTopProduct = (item) => {
  const type = getGarmentType(item);
  return type === 'top' || type === 'jacket' || type === 'dress';
};

const colorFamily = (color) => {
  const value = normalizeText(color);
  if (/black/.test(value)) return 'black';
  if (/white|cream|ivory/.test(value)) return 'white';
  if (/blue|denim|navy/.test(value)) return 'blue';
  if (/gray|grey|silver/.test(value)) return 'grey';
  if (/beige|khaki|brown|tan/.test(value)) return 'earth';
  if (/red|maroon|pink/.test(value)) return 'warm';
  if (/green|olive/.test(value)) return 'green';
  return 'neutral';
};

const scoreBottomMatch = (selectedVariant, bottom) => {
  const selectedColor = colorFamily(selectedVariant?.color);
  const bottomColor = colorFamily(bottom?.variant?.color);
  const preferred = {
    white: ['black', 'blue', 'grey', 'earth'],
    black: ['blue', 'grey', 'white', 'earth'],
    blue: ['white', 'black', 'grey', 'earth'],
    grey: ['black', 'white', 'blue'],
    earth: ['white', 'black', 'blue', 'green'],
    warm: ['black', 'white', 'blue'],
    green: ['white', 'black', 'earth'],
    neutral: ['black', 'blue', 'grey'],
  };

  let score = 60;
  if (preferred[selectedColor]?.includes(bottomColor)) score += 25;
  if (bottom?.variant?.imageUrl || bottom?.product?.imageUrl) score += 10;
  if (bottom?.product?.active !== false) score += 5;
  return score;
};

const getBottomPreviewFit = (gender = 'female') => {
  const width = gender === 'male' ? 138 : 126;
  const height = gender === 'male' ? 250 : 235;
  const y = gender === 'male' ? 285 : 305;
  return {
    pos: { x: Math.round((CANVAS_W - width) / 2), y },
    size: { w: width, h: height },
  };
};

const calculatePoseFit = ({ leftShoulder, rightShoulder, leftHip, rightHip, product, clothingImg }) => {
  const shoulderL = leftShoulder.x * CANVAS_W;
  const shoulderR = rightShoulder.x * CANVAS_W;
  const shoulderY = ((leftShoulder.y + rightShoulder.y) / 2) * CANVAS_H;
  const shoulderWidth = Math.abs(shoulderR - shoulderL);
  const shoulderCenterX = (shoulderL + shoulderR) / 2;
  const hasVisibleHips = leftHip?.visibility > 0.35 && rightHip?.visibility > 0.35;
  const detectedHipY = hasVisibleHips ? ((leftHip.y + rightHip.y) / 2) * CANVAS_H : shoulderY + shoulderWidth * 2.15;
  const torsoHeight = clamp(detectedHipY - shoulderY, shoulderWidth * 1.25, shoulderWidth * 2.45);
  const garmentType = getGarmentType(product);
  const imageRatio = clothingImg?.naturalWidth ? clothingImg.naturalHeight / clothingImg.naturalWidth : 1.1;

  let widthMultiplier = 1.55;
  let minHeightFactor = 0.85;
  let maxHeightFactor = 1.18;
  let yLiftFactor = 0.1;

  if (garmentType === 'jacket') {
    widthMultiplier = 1.7;
    maxHeightFactor = 1.28;
  }

  if (garmentType === 'dress') {
    widthMultiplier = 1.55;
    minHeightFactor = 1.45;
    maxHeightFactor = 2.4;
    yLiftFactor = 0.06;
  }

  const width = clamp(shoulderWidth * widthMultiplier, 90, CANVAS_W * 0.82);
  const naturalHeight = width * imageRatio;
  const height = clamp(
    naturalHeight,
    torsoHeight * minHeightFactor,
    torsoHeight * maxHeightFactor
  );
  const x = clamp(shoulderCenterX - width / 2, 0, CANVAS_W - width);
  const y = clamp(shoulderY - height * yLiftFactor, 0, CANVAS_H - height);

  return {
    pos: { x, y },
    size: { w: width, h: height },
  };
};

const getQuickPreviewFit = (bodyShape, product, clothingImg, gender = 'female') => {
  const garmentType = getGarmentType(product);
  const imageRatio = clothingImg?.naturalWidth ? clothingImg.naturalHeight / clothingImg.naturalWidth : 0.82;
  const femaleWidth = 168;
  const maleWidth = 174;
  const shapeWidth = gender === 'male' ? maleWidth : femaleWidth;

  let width = shapeWidth;
  let y = gender === 'male' ? 132 : 155;
  let height = width * imageRatio;

  if (garmentType === 'top') {
    height = clamp(height, gender === 'male' ? 138 : 132, gender === 'male' ? 178 : 168);
  } else if (garmentType === 'jacket') {
    width += 14;
    height = clamp(width * imageRatio, gender === 'male' ? 155 : 150, gender === 'male' ? 220 : 210);
    y = gender === 'male' ? 126 : 150;
  } else if (garmentType === 'dress') {
    width += 6;
    height = clamp(width * imageRatio, 230, 345);
    y = 150;
  }

  return {
    pos: { x: Math.round((CANVAS_W - width) / 2), y: Math.round(y) },
    size: { w: Math.round(width), h: Math.round(height) },
  };
};

export default function TryOn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { product, variant } = location.state || {};

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const modelImgRef = useRef(null);
  const clothingImgRef = useRef(null);
  const bottomImgRef = useRef(null);
  const animFrameRef = useRef(null);

  const [mode, setMode] = useState('model'); // 'model' | 'photo' | 'camera'
  const [gender, setGender] = useState('female');
  const [bodyShape, setBodyShape] = useState('regular');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [clothingPos, setClothingPos] = useState({ x: 130, y: 160 });
  const [clothingSize, setClothingSize] = useState({ w: 140, h: 155 });
  const [opacity, setOpacity] = useState(0.92);
  const [isDragging, setIsDragging] = useState(false);
  const [activeLayer, setActiveLayer] = useState('top');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modelLoaded, setModelLoaded] = useState(false);
  const [clothingLoaded, setClothingLoaded] = useState(false);
  const [bottomLoaded, setBottomLoaded] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [bottomPos, setBottomPos] = useState(getBottomPreviewFit('female').pos);
  const [bottomSize, setBottomSize] = useState(getBottomPreviewFit('female').size);
  const [poseStatus, setPoseStatus] = useState('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const clothingImage = variant?.imageUrl || product?.imageUrl || '';
  const bottomImage = selectedBottom?.variant?.imageUrl || selectedBottom?.product?.imageUrl || '';
  const selectedProductType = getGarmentType(product);
  const recommendationType = selectedProductType === 'bottom' ? 'top' : 'bottom';
  const productGender = inferGender(product);
  const genderOptions = productGender === 'male' || productGender === 'female'
    ? [[productGender, GENDER_CONFIGS[productGender]]]
    : Object.entries(GENDER_CONFIGS);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const inferred = inferGender(product);
    if (inferred === 'male' || inferred === 'female') {
      setGender(inferred);
    }
  }, [product]);

  // Draw clothing overlay without edit outlines so the preview looks clean.
  const drawClothing = (ctx, img) => {
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, clothingPos.x, clothingPos.y, clothingSize.w, clothingSize.h);
    ctx.restore();
  };

  const drawBottom = (ctx, img) => {
    if (!img || !img.complete || !img.naturalWidth || !selectedBottom) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, bottomPos.x, bottomPos.y, bottomSize.w, bottomSize.h);
    ctx.restore();
  };

  // Draw the real mannequin asset. Body shape changes garment placement, not the mannequin image itself.
  const drawModelCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const modelImg = modelImgRef.current;
    const clothingImg = clothingImgRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (modelImg?.complete && modelImg.naturalWidth) {
      const modelConfig = GENDER_CONFIGS[gender] || GENDER_CONFIGS.female;
      const shapeConfig = SHAPE_CONFIGS[bodyShape] || SHAPE_CONFIGS.regular;
      const source = modelConfig.sourceCrop || {
        x: 0,
        y: 0,
        w: modelImg.naturalWidth,
        h: modelImg.naturalHeight,
      };
      const scale = Math.min((CANVAS_W * modelConfig.modelWidth) / source.w, (CANVAS_H * 0.96) / source.h);
      const drawW = source.w * scale * shapeConfig.scaleX;
      const drawH = source.h * scale;
      const x = (CANVAS_W - drawW) / 2;
      const y = CANVAS_H - drawH - modelConfig.yOffset;

      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.drawImage(modelImg, source.x, source.y, source.w, source.h, x, y, drawW, drawH);
      ctx.restore();
    }

    if (selectedProductType === 'bottom') {
      drawClothing(ctx, clothingImg);
      drawBottom(ctx, bottomImgRef.current);
    } else {
      drawBottom(ctx, bottomImgRef.current);
      drawClothing(ctx, clothingImg);
    }
  }, [gender, bodyShape, clothingPos, clothingSize, bottomPos, bottomSize, opacity, isDragging, activeLayer, selectedBottom, selectedProductType]);

  // Draw uploaded photo with clothing
  const drawPhotoCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedPhoto) return;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      // Fill white then draw photo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Scale photo to fit canvas maintaining aspect ratio
      const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
      const x = (CANVAS_W - img.width * scale) / 2;
      const y = (CANVAS_H - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      if (selectedProductType === 'bottom') {
        drawClothing(ctx, clothingImgRef.current);
        drawBottom(ctx, bottomImgRef.current);
      } else {
        drawBottom(ctx, bottomImgRef.current);
        drawClothing(ctx, clothingImgRef.current);
      }
    };
    img.src = uploadedPhoto;
  }, [uploadedPhoto, clothingPos, clothingSize, bottomPos, bottomSize, opacity, activeLayer, selectedBottom, selectedProductType]);

  // Quick Preview uses the selected mannequin asset from public/models.
  useEffect(() => {
    if (mode !== 'model') return;
    const modelConfig = GENDER_CONFIGS[gender] || GENDER_CONFIGS.female;
    setModelLoaded(false);
    const img = new Image();
    img.onload = () => {
      modelImgRef.current = img;
      setModelLoaded(true);
    };
    img.onerror = () => {
      modelImgRef.current = null;
      setModelLoaded(true);
      showToast('Mannequin image failed to load.', 'error');
    };
    img.src = modelConfig.image;
  }, [mode, gender]);

  // Load clothing image once
  // NOTE: crossOrigin='anonymous' was removed here. It was silently causing
  // the browser to fail loading product images that don't return an
  // Access-Control-Allow-Origin header from the backend, which meant
  // clothingImgRef.current never got set and drawClothing() had nothing to draw.
  useEffect(() => {
    if (!clothingImage) return;
    setClothingLoaded(false);
    const img = new Image();
    img.onload = () => {
      clothingImgRef.current = img;
      setClothingLoaded(true);
      if (mode === 'model') {
        const fit = selectedProductType === 'bottom'
          ? getBottomPreviewFit(gender)
          : getQuickPreviewFit(bodyShape, product, img, gender);
        setClothingPos(fit.pos);
        setClothingSize(fit.size);
      }
    };
    img.onerror = (e) => {
      console.error('Clothing image failed to load:', clothingImage, e);
      clothingImgRef.current = null;
      setClothingLoaded(false);
      showToast('Clothing image failed to load — check the product image URL.', 'error');
    };
    img.src = clothingImage;
  }, [clothingImage, mode, gender, product, selectedProductType]);

  useEffect(() => {
    if (!product) {
      setRecommendations([]);
      return;
    }

    let cancelled = false;
    const loadRecommendations = async () => {
      try {
        setRecommendationLoading(true);
        const response = await productAPI.getAll();
        const allProducts = getResponseList(response.data);
        const candidateProducts = allProducts
          .filter((item) => item?.id !== product.id)
          .filter((item) => recommendationType === 'bottom' ? isBottomProduct(item) : isTopProduct(item))
          .filter((item) => item?.active !== false);

        const enriched = await Promise.all(candidateProducts.map(async (item) => {
          let variants = Array.isArray(item.variants) ? item.variants : [];
          if (variants.length === 0) {
            try {
              const variantsResponse = await variantAPI.getByProductId(item.id);
              variants = getResponseList(variantsResponse.data);
            } catch {
              variants = [];
            }
          }

          const productWithVariants = { ...item, variants };
          const usableVariant = getFirstUsableVariant(productWithVariants);
          if (!usableVariant) return null;

          return {
            product: productWithVariants,
            variant: usableVariant,
            score: scoreBottomMatch(variant, { product: productWithVariants, variant: usableVariant }),
          };
        }));

        const selectedGender = inferGender(product);
        const ranked = enriched
          .filter(Boolean)
          .filter((item) => {
            const itemGender = inferGender(item.product);
            return selectedGender === 'unisex' || itemGender === 'unisex' || itemGender === selectedGender || itemGender === gender;
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);

        if (!cancelled) setRecommendations(ranked);
      } catch (err) {
        console.error('Failed to load outfit recommendations:', err);
        if (!cancelled) {
          setRecommendations([]);
          showToast('Could not load outfit recommendations.', 'error');
        }
      } finally {
        if (!cancelled) setRecommendationLoading(false);
      }
    };

    loadRecommendations();
    return () => { cancelled = true; };
  }, [product, variant, gender, recommendationType]);

  useEffect(() => {
    if (!bottomImage) {
      bottomImgRef.current = null;
      setBottomLoaded(false);
      return;
    }

    setBottomLoaded(false);
    const img = new Image();
    img.onload = () => {
      bottomImgRef.current = img;
      setBottomLoaded(true);
      const fit = recommendationType === 'bottom'
        ? getBottomPreviewFit(gender)
        : getQuickPreviewFit(bodyShape, selectedBottom?.product, img, gender);
      setBottomPos(fit.pos);
      setBottomSize(fit.size);
    };
    img.onerror = () => {
      bottomImgRef.current = null;
      setBottomLoaded(false);
      showToast('Recommended bottom image failed to load.', 'error');
    };
    img.src = bottomImage;
  }, [bottomImage, gender, bodyShape, recommendationType, selectedBottom]);

  // Redraw when model or settings change
  useEffect(() => {
    if (mode === 'model' && modelLoaded) drawModelCanvas();
  }, [modelLoaded, bodyShape, clothingPos, clothingSize, bottomPos, bottomSize, opacity, clothingLoaded, bottomLoaded, selectedBottom]);

  useEffect(() => {
    if (mode === 'photo' && uploadedPhoto) drawPhotoCanvas();
  }, [uploadedPhoto, clothingPos, clothingSize, bottomPos, bottomSize, opacity, clothingLoaded, bottomLoaded, selectedBottom]);

  // MediaPipe pose detection on uploaded photo
  const runPoseDetection = async (imageSrc) => {
    setPoseStatus('loading');
    try {
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      setPoseStatus('detecting');

      pose.onResults((results) => {
        if (results.poseLandmarks) {
          const kp = results.poseLandmarks;
          const ls = kp[11]; const rs = kp[12];
          const lh = kp[23]; const rh = kp[24];

          if (ls?.visibility > 0.5 && rs?.visibility > 0.5) {
            const fit = calculatePoseFit({
              leftShoulder: ls,
              rightShoulder: rs,
              leftHip: lh,
              rightHip: rh,
              product,
              clothingImg: clothingImgRef.current,
            });

            setClothingPos(fit.pos);
            setClothingSize(fit.size);
            setPoseStatus('done');
            showToast('✅ Body detected! Clothing auto-positioned!');
          } else {
            setPoseStatus('error');
            showToast('Could not detect body. Try a clearer front-facing photo.', 'error');
          }
        } else {
          setPoseStatus('error');
          showToast('No body detected. Use a full-body front-facing photo.', 'error');
        }
      });

      await pose.initialize();
      const img = new Image();
      img.onload = async () => {
        const off = document.createElement('canvas');
        off.width = 640; off.height = 480;
        off.getContext('2d').drawImage(img, 0, 0, 640, 480);
        await pose.send({ image: off });
      };
      img.src = imageSrc;
    } catch (err) {
      setPoseStatus('error');
      showToast('AI detection failed. Adjust manually using sliders.', 'error');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target.result;
      setUploadedPhoto(src);
      setMode('photo');
      setModelLoaded(true);
      setClothingPos({ x: 100, y: 130 });
      setClothingSize({ w: 200, h: 220 });
      setPoseStatus('idle');
      await runPoseDetection(src);
    };
    reader.readAsDataURL(file);
  };

  // Start live camera with MediaPipe
  const startCamera = async () => {
    setMode('camera');
    setCameraActive(true);
    setPoseStatus('loading');

    setTimeout(async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = stream;
        await video.play();

        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

        pose.onResults((results) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
          ctx.save();
          ctx.translate(CANVAS_W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
          ctx.restore();

          if (results.poseLandmarks && clothingImgRef.current?.complete) {
            const kp = results.poseLandmarks;
            const ls = kp[11]; const rs = kp[12];
            const lh = kp[23]; const rh = kp[24];
            if (ls?.visibility > 0.4 && rs?.visibility > 0.4) {
              const fit = calculatePoseFit({
                leftShoulder: { ...rs, x: 1 - rs.x },
                rightShoulder: { ...ls, x: 1 - ls.x },
                leftHip: rh ? { ...rh, x: 1 - rh.x } : rh,
                rightHip: lh ? { ...lh, x: 1 - lh.x } : lh,
                product,
                clothingImg: clothingImgRef.current,
              });

              ctx.save();
              ctx.globalAlpha = 0.88;
              ctx.drawImage(clothingImgRef.current, fit.pos.x, fit.pos.y, fit.size.w, fit.size.h);
              ctx.restore();
              setPoseStatus('done');
            }
          }
        });

        poseRef.current = pose;
        await pose.initialize();

        const camera = new Camera(video, {
          onFrame: async () => { await pose.send({ image: video }); },
          width: 640, height: 480,
        });
        camera.start();
        cameraRef.current = camera;
        setPoseStatus('detecting');
      } catch (err) {
        setPoseStatus('error');
        showToast('Camera access denied or unavailable.', 'error');
        setMode('model');
        setCameraActive(false);
      }
    }, 200);
  };

  const stopCamera = () => {
    if (cameraRef.current) { cameraRef.current.stop(); cameraRef.current = null; }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setCameraActive(false);
    setMode('model');
    setPoseStatus('idle');
  };

  useEffect(() => { return () => { if (cameraActive) stopCamera(); }; }, []);

  // Drag handlers
  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    if (mode === 'camera') return;
    const pos = getCanvasPos(e, canvasRef.current);
    const insideTop = pos.x >= clothingPos.x && pos.x <= clothingPos.x + clothingSize.w &&
        pos.y >= clothingPos.y && pos.y <= clothingPos.y + clothingSize.h;
    const insideBottom = selectedBottom &&
        pos.x >= bottomPos.x && pos.x <= bottomPos.x + bottomSize.w &&
        pos.y >= bottomPos.y && pos.y <= bottomPos.y + bottomSize.h;

    if (activeLayer === 'bottom' && insideBottom) {
      setIsDragging(true);
      setDragStart({ x: pos.x - bottomPos.x, y: pos.y - bottomPos.y });
    } else if (activeLayer === 'top' && insideTop) {
      setIsDragging(true);
      setDragStart({ x: pos.x - clothingPos.x, y: pos.y - clothingPos.y });
    } else if (insideTop) {
      setActiveLayer('top');
      setIsDragging(true);
      setDragStart({ x: pos.x - clothingPos.x, y: pos.y - clothingPos.y });
    } else if (insideBottom) {
      setActiveLayer('bottom');
      setIsDragging(true);
      setDragStart({ x: pos.x - bottomPos.x, y: pos.y - bottomPos.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || mode === 'camera') return;
    e.preventDefault();
    const pos = getCanvasPos(e, canvasRef.current);
    if (activeLayer === 'bottom' && selectedBottom) {
      setBottomPos({
        x: Math.max(0, Math.min(CANVAS_W - bottomSize.w, pos.x - dragStart.x)),
        y: Math.max(0, Math.min(CANVAS_H - bottomSize.h, pos.y - dragStart.y)),
      });
    } else {
      setClothingPos({
        x: Math.max(0, Math.min(CANVAS_W - clothingSize.w, pos.x - dragStart.x)),
        y: Math.max(0, Math.min(CANVAS_H - clothingSize.h, pos.y - dragStart.y)),
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    try {
      const link = document.createElement('a');
      link.download = `styletry-${product?.name || 'tryon'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Image downloaded!');
    } catch (err) {
      console.error('Download failed (likely a tainted canvas from a cross-origin image):', err);
      showToast('Could not download — the clothing image host needs to allow CORS for downloads to work.', 'error');
    }
  };

  const handleAddToCart = async () => {
    if (!variant?.id) { showToast('Please go back and select a variant', 'error'); return; }
    setAddingToCart(true);
    const result = await addToCart(variant.id, 1);
    let bottomResult = null;
    if (result?.success && selectedBottom?.variant?.id) {
      bottomResult = await addToCart(selectedBottom.variant.id, 1);
    }
    setAddingToCart(false);
    if (result?.success && (!selectedBottom || bottomResult?.success)) {
      showToast(selectedBottom ? 'Outfit added to cart!' : 'Added to cart!');
      setTimeout(() => navigate('/cart'), 1500);
    } else {
      showToast(bottomResult?.message || result?.message || 'Failed to add to cart', 'error');
    }
  };

  const resetClothing = () => {
    const fit = mode === 'model'
      ? selectedProductType === 'bottom'
        ? getBottomPreviewFit(gender)
        : getQuickPreviewFit(bodyShape, product, clothingImgRef.current, gender)
      : { pos: { x: 100, y: 130 }, size: { w: 200, h: 220 } };
    const bottomFit = recommendationType === 'bottom'
      ? getBottomPreviewFit(gender)
      : getQuickPreviewFit(bodyShape, selectedBottom?.product, bottomImgRef.current, gender);

    setClothingPos(fit.pos);
    setClothingSize(fit.size);
    setBottomPos(bottomFit.pos);
    setBottomSize(bottomFit.size);
    setOpacity(0.92);
  };

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '3rem' }}>👗</p>
        <h2>No product selected</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Please select a product from the shop first</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Browse Products</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '1rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', color: 'white',
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>👔 Virtual Try-On</h1>
        <p style={{ color: '#64748b', margin: '0.4rem 0 0 0', fontSize: '0.9rem' }}>
          Upload a photo for a fit matched to <strong>your</strong> body, or use the quick preview model
        </p>
      </div>

      {/* Mode Tabs — Upload Photo is the recommended/primary flow since it fits YOUR body */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{
          position: 'relative',
          padding: '0.65rem 1.3rem', borderRadius: '0.7rem', fontWeight: '800',
          border: '2px solid #7c3aed', cursor: 'pointer', fontSize: '0.92rem',
          background: mode === 'photo' ? '#7c3aed' : '#f5f3ff',
          color: mode === 'photo' ? 'white' : '#7c3aed',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          boxShadow: mode === 'photo' ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
        }}>
          <span style={{
            position: 'absolute', top: '-10px', right: '-8px',
            background: '#f59e0b', color: 'white', fontSize: '0.62rem', fontWeight: '800',
            padding: '0.15rem 0.5rem', borderRadius: '999px', whiteSpace: 'nowrap',
          }}>⭐ Best Fit</span>
          📸 Upload Photo {poseStatus === 'done' && mode === 'photo' && '✅'}
          <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </label>

        {[
          { key: 'model', label: '🧍 Quick Preview', color: '#4f46e5' },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => { if (cameraActive) stopCamera(); setMode(key); }}
            style={{
              padding: '0.5rem 1.1rem', borderRadius: '0.6rem', fontWeight: '700',
              border: `2px solid ${color}`, cursor: 'pointer', fontSize: '0.85rem',
              background: mode === key ? color : 'white',
              color: mode === key ? 'white' : color,
            }}>{label}</button>
        ))}

        <button onClick={cameraActive ? stopCamera : startCamera}
          style={{
            padding: '0.5rem 1.1rem', borderRadius: '0.6rem', fontWeight: '700',
            border: '2px solid #dc2626', cursor: 'pointer', fontSize: '0.85rem',
            background: mode === 'camera' ? '#dc2626' : 'white',
            color: mode === 'camera' ? 'white' : '#dc2626',
          }}>{cameraActive ? '⏹ Stop Camera' : '📷 Live Camera'}</button>

        {/* Status Badge */}
        {poseStatus === 'loading' && <span style={{ padding: '0.5rem 0.75rem', background: '#fef3c7', borderRadius: '0.6rem', fontSize: '0.8rem', fontWeight: '600', color: '#92400e' }}>⏳ Loading AI...</span>}
        {poseStatus === 'detecting' && <span style={{ padding: '0.5rem 0.75rem', background: '#dbeafe', borderRadius: '0.6rem', fontSize: '0.8rem', fontWeight: '600', color: '#1e40af' }}>🔍 Detecting...</span>}
        {poseStatus === 'done' && <span style={{ padding: '0.5rem 0.75rem', background: '#dcfce7', borderRadius: '0.6rem', fontSize: '0.8rem', fontWeight: '600', color: '#166534' }}>✅ Body detected!</span>}
        {!clothingLoaded && clothingImage && <span style={{ padding: '0.5rem 0.75rem', background: '#fee2e2', borderRadius: '0.6rem', fontSize: '0.8rem', fontWeight: '600', color: '#991b1b' }}>⚠️ Clothing image not loaded</span>}
      </div>

      {mode === 'model' && (
        <p style={{
          background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
          padding: '0.6rem 0.9rem', borderRadius: '0.6rem', fontSize: '0.82rem',
          margin: '-0.6rem 0 1.1rem 0',
        }}>
          💡 This is a generic preview model, not your body shape. For an accurate fit, use <strong>Upload Photo</strong> above.
        </p>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Canvas Column */}
        <div style={{ flex: '0 0 auto' }}>
          {/* Model Controls */}
          {mode === 'model' && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151', margin: '0 0 0.3rem 0' }}>Gender</p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {genderOptions.map(([key, { label, icon }]) => (
                    <button key={key} onClick={() => {
                      setGender(key);
                      const fit = getQuickPreviewFit(bodyShape, product, clothingImgRef.current, key);
                      setClothingPos(fit.pos);
                      setClothingSize(fit.size);
                    }} style={{
                      padding: '0.35rem 0.85rem', borderRadius: '999px', fontWeight: '600',
                      border: '2px solid #4f46e5', cursor: 'pointer', fontSize: '0.8rem',
                      background: gender === key ? '#4f46e5' : 'white',
                      color: gender === key ? 'white' : '#4f46e5',
                    }}>{icon} {label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151', margin: '0 0 0.3rem 0' }}>Body Shape</p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {Object.entries(SHAPE_CONFIGS).map(([key, { label, color, textColor }]) => (
                    <button key={key} onClick={() => {
                      setBodyShape(key);
                    }} style={{
                      padding: '0.35rem 0.85rem', borderRadius: '999px', fontWeight: '600',
                      border: `2px solid ${textColor}`, cursor: 'pointer', fontSize: '0.8rem',
                      background: bodyShape === key ? textColor : 'white',
                      color: bodyShape === key ? 'white' : textColor,
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div style={{
            borderRadius: '1rem', overflow: 'hidden',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            width: '280px', background: '#fff', position: 'relative',
          }}>
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                width: '280px', height: '420px', display: 'block',
                cursor: mode === 'camera' ? 'default' : (isDragging ? 'grabbing' : 'grab'),
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
            {!modelLoaded && mode !== 'camera' && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(248,250,252,0.9)', flexDirection: 'column', gap: '0.5rem'
              }}>
                <div style={{ fontSize: '1.5rem' }}>⏳</div>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading model...</p>
              </div>
            )}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.72rem', textAlign: 'center', marginTop: '0.4rem' }}>
            {mode === 'camera' ? '🤖 AI tracking in real-time' : '💡 Drag clothing to reposition'}
          </p>
        </div>

        {/* Controls Column */}
        <div style={{ flex: '1', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Product Info */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', fontWeight: '700' }}>Selected Product</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name}
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
              )}
              <div>
                <p style={{ fontWeight: '700', margin: 0, fontSize: '0.88rem' }}>{product.name}</p>
                {variant && <p style={{ color: '#64748b', margin: '0.15rem 0 0 0', fontSize: '0.8rem' }}>{variant.size} • {variant.color}</p>}
                {variant && <p style={{ color: '#4f46e5', fontWeight: '800', margin: '0.15rem 0 0 0' }}>Rs {parseFloat(variant.price || 0).toLocaleString('en-IN')}</p>}
              </div>
            </div>
          </div>

          {/* Outfit Recommendations */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800' }}>Complete the Look</h3>
                <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                  Recommended {recommendationType === 'bottom' ? 'bottoms' : 'tops'} for this item
                </p>
              </div>
              {selectedBottom && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBottom(null);
                    setActiveLayer('top');
                  }}
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '0.45rem',
                    padding: '0.35rem 0.55rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {recommendationLoading ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                Loading matching {recommendationType === 'bottom' ? 'bottoms' : 'tops'}...
              </p>
            ) : recommendations.length === 0 ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                Add {recommendationType === 'bottom' ? 'pants, jeans, or trousers' : 'shirts, tops, or jackets'} in Admin Products to show outfit suggestions.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
                {recommendations.map((item) => {
                  const active = selectedBottom?.variant?.id === item.variant.id;
                  const previewImage = item.variant.imageUrl || item.product.imageUrl;
                  return (
                    <button
                      key={`${item.product.id}-${item.variant.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedBottom(item);
                        setActiveLayer('bottom');
                      }}
                      style={{
                        textAlign: 'left',
                        border: active ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        background: active ? '#eef2ff' : '#ffffff',
                        borderRadius: '0.65rem',
                        padding: '0.55rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt={item.product.name}
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '0.45rem', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '0.45rem', background: '#f1f5f9', display: 'grid', placeItems: 'center' }}>👖</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>{item.variant.size} • {item.variant.color}</p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#4f46e5', fontWeight: '800' }}>{item.score}% match</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adjust Clothing */}
          {mode !== 'camera' && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', fontWeight: '700' }}>Adjust Clothing</h3>
              {selectedBottom && (
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem' }}>
                  {[
                    { key: 'top', label: 'Selected Product' },
                    { key: 'bottom', label: 'Recommended Item' },
                  ].map((layer) => (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() => setActiveLayer(layer.key)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        borderRadius: '0.5rem',
                        border: activeLayer === layer.key ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        background: activeLayer === layer.key ? '#eef2ff' : '#ffffff',
                        color: activeLayer === layer.key ? '#4338ca' : '#475569',
                        fontWeight: '800',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              )}
              {[
                {
                  label: 'Left',
                  value: activeLayer === 'bottom' && selectedBottom ? bottomPos.x : clothingPos.x,
                  min: 0,
                  max: CANVAS_W,
                  unit: 'px',
                  onChange: v => activeLayer === 'bottom' && selectedBottom
                    ? setBottomPos(p => ({ ...p, x: clamp(v, 0, CANVAS_W - bottomSize.w) }))
                    : setClothingPos(p => ({ ...p, x: clamp(v, 0, CANVAS_W - clothingSize.w) })),
                },
                {
                  label: 'Top',
                  value: activeLayer === 'bottom' && selectedBottom ? bottomPos.y : clothingPos.y,
                  min: 0,
                  max: CANVAS_H,
                  unit: 'px',
                  onChange: v => activeLayer === 'bottom' && selectedBottom
                    ? setBottomPos(p => ({ ...p, y: clamp(v, 0, CANVAS_H - bottomSize.h) }))
                    : setClothingPos(p => ({ ...p, y: clamp(v, 0, CANVAS_H - clothingSize.h) })),
                },
                {
                  label: 'Width',
                  value: activeLayer === 'bottom' && selectedBottom ? bottomSize.w : clothingSize.w,
                  min: 40,
                  max: 380,
                  unit: 'px',
                  onChange: v => activeLayer === 'bottom' && selectedBottom
                    ? setBottomSize(p => ({ ...p, w: v }))
                    : setClothingSize(p => ({ ...p, w: v })),
                },
                {
                  label: 'Height',
                  value: activeLayer === 'bottom' && selectedBottom ? bottomSize.h : clothingSize.h,
                  min: 40,
                  max: 550,
                  unit: 'px',
                  onChange: v => activeLayer === 'bottom' && selectedBottom
                    ? setBottomSize(p => ({ ...p, h: v }))
                    : setClothingSize(p => ({ ...p, h: v })),
                },
                { label: 'Opacity', value: Math.round(opacity * 100), min: 30, max: 100, unit: '%', onChange: v => setOpacity(v / 100) },
              ].map(({ label, value, min, max, unit, onChange }) => (
                <div key={label} style={{ marginBottom: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>{label}</label>
                    <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: '700' }}>{value}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#4f46e5' }} />
                </div>
              ))}
              <button onClick={resetClothing} style={{
                width: '100%', padding: '0.5rem', background: '#f1f5f9',
                border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.4rem',
              }}>🔄 Reset Position</button>
            </div>
          )}

          {/* AI Info */}
          <div style={{ background: '#f0f4ff', borderRadius: '1rem', padding: '1rem', border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '700', color: '#4f46e5' }}>🤖 How it works</h3>
            <div style={{ fontSize: '0.78rem', color: '#4338ca', lineHeight: '1.7' }}>
              <p style={{ margin: 0 }}>📸 <strong>Upload Photo</strong> (recommended) — AI detects your actual body and fits clothing to you</p>
              <p style={{ margin: '0.25rem 0 0 0' }}>🧍 <strong>Quick Preview</strong> — Approximate look on a generic model, no upload needed</p>
              <p style={{ margin: '0.25rem 0 0 0' }}>📷 <strong>Live Camera</strong> — Real-time AI clothing overlay</p>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button onClick={handleAddToCart} disabled={addingToCart} style={{
              padding: '0.85rem', background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem',
            }}>{addingToCart ? 'Adding...' : '🛒 Add to Cart'}</button>
            {mode !== 'camera' && (
              <button onClick={handleDownload} style={{
                padding: '0.85rem', background: '#10b981', color: 'white',
                border: 'none', borderRadius: '0.75rem', fontWeight: '700',
                cursor: 'pointer', fontSize: '0.95rem',
              }}>📥 Download Result</button>
            )}
            <button onClick={() => navigate(-1)} style={{
              padding: '0.85rem', background: 'white', color: '#4f46e5',
              border: '2px solid #4f46e5', borderRadius: '0.75rem',
              fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem',
            }}>← Back to Product</button>
          </div>
        </div>
      </div>
    </div>
  );
}
