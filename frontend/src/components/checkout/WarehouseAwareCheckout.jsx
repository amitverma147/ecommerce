import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Warehouse as WarehouseIcon,
} from "@mui/icons-material";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import warehouseAPI from "../../api/warehouseApi";

const steps = [
  "Delivery Validation",
  "Review Order",
  "Payment",
  "Confirmation",
];

const WarehouseAwareCheckout = ({ onOrderComplete }) => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [pincode, setPincode] = useState("");
  const [deliveryValidation, setDeliveryValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [stockReservation, setStockReservation] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  useEffect(() => {
    // Load saved pincode
    const savedPincode = localStorage.getItem("userPincode");
    if (savedPincode) {
      setPincode(savedPincode);
    }
  }, []);

  const validateDelivery = async () => {
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await warehouseAPI.validateCartDelivery(
        user.id,
        pincode
      );

      if (response.success) {
        setDeliveryValidation(response);
        localStorage.setItem("userPincode", pincode);

        if (response.all_deliverable) {
          setActiveStep(1); // Move to review step
        }
      } else {
        setError(response.error || "Failed to validate delivery");
      }
    } catch (error) {
      console.error("Error validating delivery:", error);
      setError("Failed to validate delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reserveStock = async () => {
    if (!deliveryValidation || !deliveryValidation.all_deliverable) {
      setError("Please validate delivery first");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Generate order ID
      const newOrderId = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setOrderId(newOrderId);

      const response = await warehouseAPI.reserveCartStock(
        user.id,
        pincode,
        newOrderId
      );

      if (response.success && response.all_reserved) {
        setStockReservation(response);
        setActiveStep(2); // Move to payment step
      } else {
        setError("Some items could not be reserved. Please review your cart.");
        setStockReservation(response);
      }
    } catch (error) {
      console.error("Error reserving stock:", error);
      setError("Failed to reserve stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    // Mock payment processing
    try {
      setLoading(true);
      setError("");

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Confirm stock deduction after successful payment
      if (stockReservation && stockReservation.reservation_results) {
        const warehouseAssignments = stockReservation.reservation_results
          .filter((result) => result.success)
          .map((result) => ({
            product_id: result.product_id,
            warehouse_id: result.warehouse_id,
            quantity: result.quantity,
          }));

        const confirmResponse = await warehouseAPI.confirmStockDeduction(
          orderId,
          warehouseAssignments
        );

        if (confirmResponse.success && confirmResponse.all_deducted) {
          setActiveStep(3); // Move to confirmation
          clearCart(); // Clear the cart
          if (onOrderComplete) {
            onOrderComplete(orderId);
          }
        } else {
          setError(
            "Payment successful but stock deduction failed. Please contact support."
          );
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderDeliveryValidation = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Delivery Validation
        </Typography>

        <Box mb={3}>
          <input
            type="text"
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setPincode(value);
            }}
            style={{
              width: "200px",
              padding: "8px",
              marginRight: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <Button
            variant="contained"
            onClick={validateDelivery}
            disabled={loading || !pincode || pincode.length !== 6}
            startIcon={
              loading ? <CircularProgress size={20} /> : <ShippingIcon />
            }
          >
            {loading ? "Validating..." : "Check Delivery"}
          </Button>
        </Box>

        {deliveryValidation && (
          <Box>
            <Alert
              severity={
                deliveryValidation.all_deliverable ? "success" : "error"
              }
              sx={{ mb: 2 }}
            >
              <Typography variant="body1" fontWeight="bold">
                {deliveryValidation.all_deliverable
                  ? "All items can be delivered to your location"
                  : "Some items cannot be delivered to your location"}
              </Typography>
            </Alert>

            <Box
              display="flex"
              justifyContent="between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="subtitle1">
                Delivery Summary ({deliveryValidation.summary?.total_products}{" "}
                items)
              </Typography>
              <Button
                size="small"
                onClick={() => setShowValidationDetails(!showValidationDetails)}
              >
                {showValidationDetails ? "Hide Details" : "Show Details"}
              </Button>
            </Box>

            {showValidationDetails && (
              <List>
                {deliveryValidation.products?.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={item.product_info?.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Quantity: {item.quantity}
                          </Typography>
                          {item.deliverable && item.source_warehouse && (
                            <Box mt={0.5}>
                              <Chip
                                icon={<WarehouseIcon />}
                                label={`${item.source_warehouse.name} (${item.source_warehouse.type})`}
                                color={
                                  item.source_warehouse.type === "zonal"
                                    ? "secondary"
                                    : "info"
                                }
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              {item.fallback_used && (
                                <Chip
                                  label="Zonal Delivery"
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={item.deliverable ? "Available" : "Not Available"}
                        color={item.deliverable ? "success" : "error"}
                        icon={
                          item.deliverable ? <CheckIcon /> : <WarningIcon />
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {deliveryValidation.all_deliverable && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  fullWidth
                >
                  Continue to Review Order
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderOrderReview = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order Review
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Delivery to:</strong> {pincode}
          </Typography>
        </Alert>

        <List>
          {cartItems.map((item, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={item.name}
                secondary={`Quantity: ${item.quantity} | Price: ₹${item.price}`}
              />
              <ListItemSecondaryAction>
                <Typography variant="subtitle1">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Typography>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="between" mb={2}>
          <Typography variant="h6">Total:</Typography>
          <Typography variant="h6">
            ₹
            {cartItems
              .reduce((total, item) => total + item.price * item.quantity, 0)
              .toFixed(2)}
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={reserveStock}
          disabled={loading}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : <CartIcon />}
        >
          {loading ? "Processing..." : "Reserve Items & Continue"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderPayment = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment
        </Typography>

        {stockReservation && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Stock has been reserved for your order (ID: {orderId})
            </Typography>
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          Total Amount: ₹
          {cartItems
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2)}
        </Typography>

        <Button
          variant="contained"
          onClick={processPayment}
          disabled={loading}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? "Processing Payment..." : "Pay Now"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderConfirmation = () => (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <CheckIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Order Confirmed!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your order {orderId} has been placed successfully.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          You will receive a confirmation email shortly with tracking details.
        </Typography>
        <Button
          variant="contained"
          onClick={() => (window.location.href = "/orders")}
        >
          View Orders
        </Button>
      </CardContent>
    </Card>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderDeliveryValidation();
      case 1:
        return renderOrderReview();
      case 2:
        return renderPayment();
      case 3:
        return renderConfirmation();
      default:
        return "Unknown step";
    }
  };

  return (
    <Box maxWidth="md" mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}
    </Box>
  );
};

export default WarehouseAwareCheckout;
