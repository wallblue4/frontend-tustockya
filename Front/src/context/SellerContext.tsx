import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { vendorAPI } from '../services/api';
import { transfersAPI } from '../services/transfersAPI';

interface TransfersSummary {
  total_pending: number;
  urgent_count: number;
  normal_count: number;
  completed_today: number;
  success_rate: number;
}

export interface PrefilledProduct {
  code: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  location?: string;
  storage_type?: string;
  color?: string;
  image?: string[];
  transfer_id?: number;
}

interface PredictionResult {
  class_name: string;
  confidence: number;
}

interface SellerContextType {
  // Dashboard data
  apiData: any;
  apiError: string | null;
  loading: boolean;

  // Transfers
  transfersSummary: TransfersSummary | null;
  loadTransfersSummary: () => Promise<void>;

  // Camera & scan
  showCamera: boolean;
  setShowCamera: (v: boolean) => void;
  isProcessingImage: boolean;
  setIsProcessingImage: (v: boolean) => void;
  capturedImage: File | null;
  setCapturedImage: (f: File | null) => void;
  scanResult: PredictionResult | null;
  setScanResult: (r: PredictionResult | null) => void;
  errorMessage: string | null;
  setErrorMessage: (m: string | null) => void;
  isScanning: boolean;
  isSearchMode: boolean;
  setIsSearchMode: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleCameraCapture: (imageFile: File) => Promise<void>;
  handleImageCapture: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCloseCameraCapture: () => void;

  // Product data for navigation between views
  prefilledProduct: PrefilledProduct | null;
  setPrefilledProduct: (p: PrefilledProduct | null) => void;
  productDataForTransfer: any;
  setProductDataForTransfer: (d: any) => void;

  // Scan view title
  scanViewTitle: string;
  setScanViewTitle: (t: string) => void;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export const SellerContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [transfersSummary, setTransfersSummary] = useState<TransfersSummary | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [prefilledProduct, setPrefilledProduct] = useState<PrefilledProduct | null>(null);
  const [productDataForTransfer, setProductDataForTransfer] = useState<any>(null);
  const [scanViewTitle, setScanViewTitle] = useState('Escanear Producto');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboardData();
    loadTransfersSummary();
  }, []);

  const loadDashboardData = async () => {
    try {
      setApiError(null);
      const response = await vendorAPI.getDashboard();
      setApiData(response);
    } catch {
      console.warn('Backend API not available');
      setApiError('Conectando con el servidor...');
    } finally {
      setLoading(false);
    }
  };

  const loadTransfersSummary = useCallback(async () => {
    try {
      const [pendingResponse, completedResponse] = await Promise.allSettled([
        transfersAPI.vendor.getPendingTransfers(),
        transfersAPI.vendor.getCompletedTransfers(),
      ]);

      const summary: TransfersSummary = {
        total_pending: 0,
        urgent_count: 0,
        normal_count: 0,
        completed_today: 0,
        success_rate: 0,
      };

      if (pendingResponse.status === 'fulfilled' && pendingResponse.value.success) {
        const pendingData = pendingResponse.value;
        summary.total_pending = pendingData.total_pending || 0;
        summary.urgent_count = pendingData.urgent_count || 0;
        summary.normal_count = pendingData.normal_count || 0;
      }

      if (completedResponse.status === 'fulfilled' && completedResponse.value.success) {
        const completedData = completedResponse.value;
        summary.completed_today = completedData.today_stats?.completed || 0;
        summary.success_rate = completedData.today_stats?.success_rate || 0;
      }

      setTransfersSummary(summary);
    } catch (error) {
      console.warn('Error loading transfers summary:', error);
      setTransfersSummary({
        total_pending: 1,
        urgent_count: 1,
        normal_count: 0,
        completed_today: 2,
        success_rate: 75.0,
      });
    }
  }, []);

  const sendImageToServer = async (_imageFile: File) => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult: PredictionResult = {
        class_name: 'tenis_nike',
        confidence: 0.85,
      };

      setScanResult(mockResult);
    } catch {
      setErrorMessage('Error en la simulacion del escaneo');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraCapture = async (imageFile: File) => {
    setCapturedImage(imageFile);
    setIsProcessingImage(true);
    await sendImageToServer(imageFile);
    setShowCamera(false);
    setIsProcessingImage(false);
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedImage(file);
      sendImageToServer(file);
    }
  };

  const handleCloseCameraCapture = () => {
    setShowCamera(false);
    setIsProcessingImage(false);
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
  };

  return (
    <SellerContext.Provider
      value={{
        apiData,
        apiError,
        loading,
        transfersSummary,
        loadTransfersSummary,
        showCamera,
        setShowCamera,
        isProcessingImage,
        setIsProcessingImage,
        capturedImage,
        setCapturedImage,
        scanResult,
        setScanResult,
        errorMessage,
        setErrorMessage,
        isScanning,
        isSearchMode,
        setIsSearchMode,
        fileInputRef,
        handleCameraCapture,
        handleImageCapture,
        handleCloseCameraCapture,
        prefilledProduct,
        setPrefilledProduct,
        productDataForTransfer,
        setProductDataForTransfer,
        scanViewTitle,
        setScanViewTitle,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};

export const useSeller = (): SellerContextType => {
  const context = useContext(SellerContext);
  if (context === undefined) {
    throw new Error('useSeller must be used within a SellerContextProvider');
  }
  return context;
};
