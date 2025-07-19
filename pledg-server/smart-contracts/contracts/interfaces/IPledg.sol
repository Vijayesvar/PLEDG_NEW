pragma solidity ^0.8.20;

interface IPledg {
    // Events
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 term,
        address collateralToken,
        uint256 collateralAmount
    );
    
    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 amount
    );
    
    event PaymentMade(
        uint256 indexed loanId,
        address indexed payer,
        uint256 amount,
        uint256 installmentNumber
    );
    
    event LoanCompleted(uint256 indexed loanId);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amountPaid, uint256 totalPaid);
    event LoanLiquidated(uint256 indexed loanId, address indexed liquidator);
    event LoanDefaulted(uint256 indexed loanId, uint256 defaultedAt);
    event CollateralLocked(uint256 indexed loanId, address token, uint256 amount);
    event CollateralReleased(uint256 indexed loanId, address token, uint256 amount);
    event CollateralTransferredToBackend(uint256 indexed loanId, address token, uint256 amount);
    event CollateralAuditTrail(uint256 indexed loanId, address token, uint256 amountReleased, uint256 finalContractBalance);
    event CollateralLiquidated(uint256 indexed loanId, uint256 amountLiquidated);
    event BorrowerAuthorized(address indexed borrower);
    event BorrowerAuthorizationRevoked(address indexed borrower);

    // Core Functions
    function createLoan(
        uint256 loanId,
        uint256 loanAmountInr,
        uint256 interestRate,
        uint256 ltv,
        uint256 durationInDays,
        address collateralToken,
        uint256 collateralAmount
    ) external returns (uint256);
    
    function fundLoan(uint256 loanId) external payable;
    function makePayment(uint256 loanId, uint256 paymentAmount) external;
    function checkLoanDefault(uint256 loanId) external view returns (bool);
    function markLoanAsDefaulted(uint256 loanId) external;
    function canLiquidate(uint256 loanId) external view returns (bool eligible, string memory reason);
    function testPriceOracle(address token, uint256 amount) external view returns (uint256);

    // View Functions
    function getLoan(uint256 loanId) external view returns (
        uint256 amount,
        uint256 interestRate,
        uint256 term,
        uint256 status,
        address borrower,
        address collateralToken,
        uint256 collateralAmount,
        uint256 nextDueDate,
        uint256 totalPaid,
        uint256 installmentsPaid,
        uint256 totalInstallments,
        uint256 installmentAmount,
        uint256 createdAt,
        uint256 fundedAt,
        uint256 completedAt,
        uint256 liquidationsLength
    );

    function getLoanStatus(uint256 loanId) external view returns (uint256);
    function getLoanCount() external view returns (uint256);
    function getActiveLoans() external view returns (uint256[] memory);
    function getLoansByUser(address user) external view returns (uint256[] memory);
    function getContractCollateralBalance(address token) external view returns (uint256);
    
    // Admin Functions
    function setPriceOracle(address _priceOracle) external;
    function addSupportedToken(address token) external;
    function removeSupportedToken(address token) external;
    function authorizeLoan(uint256 loanId) external;
    function revokeBorrowerAuthorization(address borrower) external;
    function pause() external;
    function unpause() external;
}
