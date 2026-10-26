// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WarrantyManagement
 * @dev Blockchain-Based Digital Warranty Management System
 */
contract WarrantyManagement {
    address public admin;

    enum ClaimStatus { SUBMITTED, APPROVED, REJECTED, COMPLETED }

    struct Product {
        string productId;
        string productName;
        string brand;
        string model;
        string serialNumber;
        address manufacturer;
        uint256 registrationDate;
        bool exists;
    }

    struct Warranty {
        uint256 warrantyId;
        string productId;
        uint256 startDate;
        uint256 expiryDate;
        address currentOwner;
        bool exists;
    }

    struct Claim {
        uint256 claimId;
        string productId;
        uint256 warrantyId;
        address customer;
        string problemDescription;
        uint256 claimDate;
        ClaimStatus status;
        bool exists;
    }

    // Role Mappings
    mapping(address => bool) public isManufacturer;
    mapping(address => bool) public isRetailer;
    mapping(address => bool) public isServiceCenter;

    address[] public manufacturersList;
    address[] public retailersList;
    address[] public serviceCentersList;

    // Data Storage
    mapping(string => Product) private products;
    string[] public productIds;

    mapping(string => Warranty) private productWarranties;
    mapping(uint256 => Warranty) private warranties;
    uint256 public nextWarrantyId = 1;
    uint256[] public warrantyIds;

    mapping(uint256 => Claim) private claims;
    uint256 public nextClaimId = 1;
    uint256[] public claimIds;

    // Events
    event OrganizationAuthorized(address indexed orgAddress, string roleType);
    event ProductRegistered(
        string productId,
        string productName,
        string brand,
        string model,
        string serialNumber,
        address indexed manufacturer
    );
    event WarrantyCreated(
        uint256 indexed warrantyId,
        string productId,
        uint256 startDate,
        uint256 expiryDate,
        address indexed manufacturer
    );
    event ProductAssigned(
        string productId,
        uint256 indexed warrantyId,
        address indexed previousOwner,
        address indexed newOwner
    );
    event ClaimCreated(
        uint256 indexed claimId,
        string productId,
        uint256 indexed warrantyId,
        address indexed customer,
        string problemDescription,
        uint256 claimDate
    );
    event ClaimStatusUpdated(
        uint256 indexed claimId,
        ClaimStatus status,
        address indexed updatedBy
    );

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin is authorized");
        _;
    }

    modifier onlyManufacturer() {
        require(isManufacturer[msg.sender], "Only authorized Manufacturer allowed");
        _;
    }

    modifier onlyRetailer() {
        require(isRetailer[msg.sender], "Only authorized Retailer allowed");
        _;
    }

    modifier onlyServiceCenter() {
        require(isServiceCenter[msg.sender], "Only authorized Service Center allowed");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // --- ADMIN FUNCTIONS ---

    function authorizeManufacturer(address _manufacturer) external onlyAdmin {
        require(_manufacturer != address(0), "Invalid wallet address");
        require(!isManufacturer[_manufacturer], "Manufacturer already authorized");
        isManufacturer[_manufacturer] = true;
        manufacturersList.push(_manufacturer);
        emit OrganizationAuthorized(_manufacturer, "MANUFACTURER");
    }

    function authorizeRetailer(address _retailer) external onlyAdmin {
        require(_retailer != address(0), "Invalid wallet address");
        require(!isRetailer[_retailer], "Retailer already authorized");
        isRetailer[_retailer] = true;
        retailersList.push(_retailer);
        emit OrganizationAuthorized(_retailer, "RETAILER");
    }

    function authorizeServiceCenter(address _serviceCenter) external onlyAdmin {
        require(_serviceCenter != address(0), "Invalid wallet address");
        require(!isServiceCenter[_serviceCenter], "Service Center already authorized");
        isServiceCenter[_serviceCenter] = true;
        serviceCentersList.push(_serviceCenter);
        emit OrganizationAuthorized(_serviceCenter, "SERVICE_CENTER");
    }

    function getAuthorizedManufacturers() external view returns (address[] memory) {
        return manufacturersList;
    }

    function getAuthorizedRetailers() external view returns (address[] memory) {
        return retailersList;
    }

    function getAuthorizedServiceCenters() external view returns (address[] memory) {
        return serviceCentersList;
    }

    function getUserRoles(address _user) external view returns (bool isAdmin, bool isManuf, bool isRet, bool isServ) {
        return (_user == admin, isManufacturer[_user], isRetailer[_user], isServiceCenter[_user]);
    }

    // --- MANUFACTURER FUNCTIONS ---

    function registerProduct(
        string calldata _productId,
        string calldata _productName,
        string calldata _brand,
        string calldata _model,
        string calldata _serialNumber
    ) external onlyManufacturer {
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(!products[_productId].exists, "Product ID already registered");

        products[_productId] = Product({
            productId: _productId,
            productName: _productName,
            brand: _brand,
            model: _model,
            serialNumber: _serialNumber,
            manufacturer: msg.sender,
            registrationDate: block.timestamp,
            exists: true
        });

        productIds.push(_productId);

        emit ProductRegistered(
            _productId,
            _productName,
            _brand,
            _model,
            _serialNumber,
            msg.sender
        );
    }

    function createWarranty(string calldata _productId, uint256 _durationInDays) external onlyManufacturer returns (uint256) {
        require(products[_productId].exists, "Product does not exist");
        require(!productWarranties[_productId].exists, "Warranty already exists for this product");
        require(_durationInDays > 0, "Duration must be greater than 0");

        uint256 currentWarrantyId = nextWarrantyId++;
        uint256 startDate = block.timestamp;
        uint256 expiryDate = startDate + (_durationInDays * 1 days);

        Warranty memory newWarranty = Warranty({
            warrantyId: currentWarrantyId,
            productId: _productId,
            startDate: startDate,
            expiryDate: expiryDate,
            currentOwner: msg.sender, // Initially owned by manufacturer
            exists: true
        });

        productWarranties[_productId] = newWarranty;
        warranties[currentWarrantyId] = newWarranty;
        warrantyIds.push(currentWarrantyId);

        emit WarrantyCreated(
            currentWarrantyId,
            _productId,
            startDate,
            expiryDate,
            msg.sender
        );

        return currentWarrantyId;
    }

    // --- RETAILER FUNCTIONS ---

    function assignOwner(string calldata _productId, address _customer) external onlyRetailer {
        require(products[_productId].exists, "Product does not exist");
        require(productWarranties[_productId].exists, "Warranty does not exist for product");
        require(_customer != address(0), "Invalid customer address");

        address previousOwner = productWarranties[_productId].currentOwner;
        productWarranties[_productId].currentOwner = _customer;
        uint256 wId = productWarranties[_productId].warrantyId;
        warranties[wId].currentOwner = _customer;

        emit ProductAssigned(_productId, wId, previousOwner, _customer);
    }

    // --- CUSTOMER FUNCTIONS ---

    function createClaim(string calldata _productId, string calldata _problemDescription) external returns (uint256) {
        require(productWarranties[_productId].exists, "Warranty not found for product");
        Warranty storage w = productWarranties[_productId];

        require(w.currentOwner == msg.sender, "Only product owner can create a claim");
        require(block.timestamp <= w.expiryDate, "Warranty has expired");
        require(bytes(_problemDescription).length > 0, "Problem description required");

        uint256 claimId = nextClaimId++;

        Claim memory newClaim = Claim({
            claimId: claimId,
            productId: _productId,
            warrantyId: w.warrantyId,
            customer: msg.sender,
            problemDescription: _problemDescription,
            claimDate: block.timestamp,
            status: ClaimStatus.SUBMITTED,
            exists: true
        });

        claims[claimId] = newClaim;
        claimIds.push(claimId);

        emit ClaimCreated(
            claimId,
            _productId,
            w.warrantyId,
            msg.sender,
            _problemDescription,
            block.timestamp
        );

        return claimId;
    }

    // --- SERVICE CENTER FUNCTIONS ---

    function updateClaimStatus(uint256 _claimId, ClaimStatus _status) external onlyServiceCenter {
        require(claims[_claimId].exists, "Claim does not exist");

        ClaimStatus currentStatus = claims[_claimId].status;

        if (currentStatus == ClaimStatus.SUBMITTED) {
            require(_status == ClaimStatus.APPROVED || _status == ClaimStatus.REJECTED, "Invalid transition from SUBMITTED");
        } else if (currentStatus == ClaimStatus.APPROVED) {
            require(_status == ClaimStatus.COMPLETED, "Invalid transition from APPROVED");
        } else {
            revert("Claim status cannot be changed further");
        }

        claims[_claimId].status = _status;

        emit ClaimStatusUpdated(_claimId, _status, msg.sender);
    }

    // --- VIEW / READ FUNCTIONS ---

    function getProduct(string calldata _productId) external view returns (Product memory) {
        require(products[_productId].exists, "Product not found");
        return products[_productId];
    }

    function getWarrantyByProductId(string calldata _productId) external view returns (Warranty memory) {
        require(productWarranties[_productId].exists, "Warranty not found for product");
        return productWarranties[_productId];
    }

    function getWarranty(uint256 _warrantyId) external view returns (Warranty memory) {
        require(warranties[_warrantyId].exists, "Warranty not found");
        return warranties[_warrantyId];
    }

    function getClaim(uint256 _claimId) external view returns (Claim memory) {
        require(claims[_claimId].exists, "Claim not found");
        return claims[_claimId];
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory list = new Product[](productIds.length);
        for (uint256 i = 0; i < productIds.length; i++) {
            list[i] = products[productIds[i]];
        }
        return list;
    }

    function getAllWarranties() external view returns (Warranty[] memory) {
        Warranty[] memory list = new Warranty[](warrantyIds.length);
        for (uint256 i = 0; i < warrantyIds.length; i++) {
            list[i] = warranties[warrantyIds[i]];
        }
        return list;
    }

    function getAllClaims() external view returns (Claim[] memory) {
        Claim[] memory list = new Claim[](claimIds.length);
        for (uint256 i = 0; i < claimIds.length; i++) {
            list[i] = claims[claimIds[i]];
        }
        return list;
    }

    function getCustomerProducts(address _customer) external view returns (Product[] memory, Warranty[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < productIds.length; i++) {
            if (productWarranties[productIds[i]].exists && productWarranties[productIds[i]].currentOwner == _customer) {
                count++;
            }
        }

        Product[] memory customerProducts = new Product[](count);
        Warranty[] memory customerWarranties = new Warranty[](count);

        uint256 index = 0;
        for (uint256 i = 0; i < productIds.length; i++) {
            string memory pId = productIds[i];
            if (productWarranties[pId].exists && productWarranties[pId].currentOwner == _customer) {
                customerProducts[index] = products[pId];
                customerWarranties[index] = productWarranties[pId];
                index++;
            }
        }

        return (customerProducts, customerWarranties);
    }
}
