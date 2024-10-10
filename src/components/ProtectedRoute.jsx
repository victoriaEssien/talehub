import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
    const accessToken = Cookies.get('TOKEN_NAME');
    
    if (!accessToken) {
        // Redirect to login if token is not found
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired, // Validate that children is provided and is a valid React node
};

export default ProtectedRoute;
