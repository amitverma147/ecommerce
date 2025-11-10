import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  Chip,
  Typography,
  Card,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  LocalShipping as ShippingIcon,
  Warehouse as WarehouseIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

const DeliveryChecker = ({ productId, quantity = 1, onDeliveryStatus }) => {
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // Load saved pincode from localStorage
  useEffect(() => {
    const savedPincode = localStorage.getItem("userPincode");
    if (savedPincode) {
      setPincode(savedPincode);
    }
  }, []);

  // Auto-check delivery when pincode is available
  useEffect(() => {
    if (pincode && pincode.length === 6 && productId) {
      checkDelivery();
    }
  }, [pincode, productId, quantity]);

  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/warehouse/products/check-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          pincode,
          quantity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDeliveryStatus(data);
        // Save pincode for future use
        localStorage.setItem("userPincode", pincode);
        // Notify parent component
        if (onDeliveryStatus) {
          onDeliveryStatus(data);
        }
      } else {
        setError(data.error || "Failed to check delivery");
        setDeliveryStatus(null);
      }
    } catch (error) {
      console.error("Error checking delivery:", error);
      setError("Failed to check delivery. Please try again.");
      setDeliveryStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);
    setError("");
    setDeliveryStatus(null);
  };

  const getDeliveryStatusColor = () => {
    if (!deliveryStatus) return "default";
    return deliveryStatus.deliverable ? "success" : "error";
  };

  const getDeliveryIcon = () => {
    if (loading) return <CircularProgress size={20} />;
    if (!deliveryStatus) return <ShippingIcon />;
    return deliveryStatus.deliverable ? <CheckIcon /> : <ErrorIcon />;
  };

  const renderDeliveryInfo = () => {
    if (!deliveryStatus) return null;

    const {
      deliverable,
      message,
      source_warehouse,
      fallback_used,
      delivery_info,
    } = deliveryStatus;

    return (
      <Box mt={2}>
        <Alert
          severity={deliverable ? "success" : "error"}
          icon={getDeliveryIcon()}
        >
          <Box>
            <Typography variant="body1" fontWeight="bold">
              {deliverable
                ? "Available for delivery"
                : "Not available for delivery"}
            </Typography>

            {message && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {message}
              </Typography>
            )}

            {deliverable && (
              <Box mt={1}>
                <Chip
                  label={`${delivery_info?.zone_name || "Zone"} - ${pincode}`}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />

                {source_warehouse && (
                  <Chip
                    icon={<WarehouseIcon />}
                    label={`${source_warehouse.name} (${source_warehouse.type})`}
                    color={
                      source_warehouse.type === "zonal" ? "secondary" : "info"
                    }
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}

                {fallback_used && (
                  <Chip
                    label="Central Warehouse Delivery"
                    color="warning"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
              </Box>
            )}

            {deliverable && (
              <Box mt={1}>
                <Button
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform: showDetails
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s",
                      }}
                    />
                  }
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </Button>
              </Box>
            )}
          </Box>
        </Alert>

        {/* Detailed Information */}
        <Collapse in={showDetails}>
          <Card sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Details
            </Typography>

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Delivery Zone
                </Typography>
                <Typography variant="body2">
                  {delivery_info?.zone_name} (ID: {delivery_info?.zone_id})
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Pincode
                </Typography>
                <Typography variant="body2">
                  {delivery_info?.pincode}
                </Typography>
              </Box>

              {source_warehouse && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Source Warehouse
                    </Typography>
                    <Typography variant="body2">
                      {source_warehouse.name}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Warehouse Type
                    </Typography>
                    <Chip
                      label={source_warehouse.type}
                      color={
                        source_warehouse.type === "zonal" ? "secondary" : "info"
                      }
                      size="small"
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Available Quantity
                    </Typography>
                    <Typography variant="body2">
                      {deliveryStatus.available_quantity} units
                    </Typography>
                  </Box>

                  {fallback_used && (
                    <Box gridColumn="1 / -1">
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Note:</strong> This item will be shipped from
                          our zonal warehouse as it's currently out of stock at
                          the local warehouse.
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Card>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="flex-start">
        <TextField
          label="Enter Pincode"
          value={pincode}
          onChange={handlePincodeChange}
          placeholder="123456"
          size="small"
          inputProps={{ maxLength: 6 }}
          error={!!error}
          helperText={error || "Enter 6-digit pincode to check delivery"}
        />

        <Button
          variant="contained"
          onClick={checkDelivery}
          disabled={loading || !pincode || pincode.length !== 6}
          startIcon={
            loading ? <CircularProgress size={20} /> : <ShippingIcon />
          }
        >
          {loading ? "Checking..." : "Check Delivery"}
        </Button>
      </Box>

      {renderDeliveryInfo()}
    </Box>
  );
};

export default DeliveryChecker;
