import './App.css';
import React, { Fragment } from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Switch,
} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Alert from './components/layout/Alert';
// Redux
import { Provider } from 'react-redux';
import store from './store';

const App = () => (
	<Provider store={store}>
		<Router>
			<Fragment>
				<Navbar />

				<section className="container">
					<Alert />
					<Routes>
						<Route index element={<Landing />} />
						<Route path="/register" element={<Register />} />
						<Route path="/login" element={<Login />} />
					</Routes>
				</section>
			</Fragment>
		</Router>
	</Provider>
);

export default App;
