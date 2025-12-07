select * from Users

UPDATE Users
SET [IsVerified] = 1
WHERE Id = 3;

select * from Emergency

DELETE FROM Emergency;

-- Insert emergency data with random coordinates
INSERT INTO Emergency (Name, Lvl_Emergency, Description, Location_X, Location_Y) 
VALUES
-- Emergencies near 46.783154, 23.608906 (Cluj-Napoca, Romania)
('Forest Fire - Cluj', 4, 'Large forest fire spreading rapidly', 46.783154, 23.608906),
('Building Collapse - City Center', 5, 'Apartment building partially collapsed', 46.783254, 23.609006),
('Chemical Spill - Industrial Zone', 3, 'Truck carrying chemicals overturned', 46.783054, 23.608806),
('Power Outage - Residential Area', 2, 'Major power outage affecting 5000 homes', 46.783354, 23.608706),
('Flooding - Somes River', 3, 'River overflow due to heavy rainfall', 46.783454, 23.609106),

-- Random locations across Romania
('Car Accident - A1 Highway', 2, 'Multi-vehicle collision, 2 injuries', 44.4268, 26.1025), -- Bucharest
('Gas Leak - Ploiesti', 3, 'Major gas leak in residential area', 44.9410, 26.0226), -- Ploiesti
('Earthquake - Vrancea', 4, 'Magnitude 5.3 earthquake felt', 45.8430, 26.9916), -- Vrancea
('Train Derailment - Brasov', 4, 'Passenger train derailed, multiple injuries', 45.6556, 25.6108), -- Brasov
('Hospital Fire - Timisoara', 5, 'Fire in hospital emergency wing', 45.7489, 21.2087), -- Timisoara

-- More random locations in Romania
('Bridge Damage - Olt River', 3, 'Structural damage detected on bridge', 44.3302, 24.3275),
('Factory Explosion - Arad', 4, 'Explosion in chemical factory', 46.1866, 21.3123),
('Water Contamination - Iasi', 3, 'Water supply contaminated, boil water advisory', 47.1585, 27.6014),
('Landslide - Carpathians', 3, 'Landslide blocking national road', 45.5000, 25.3670),
('Heatwave Alert - Dobrogea', 2, 'Extreme heat warning, elderly at risk', 44.1167, 28.6333),

-- International emergencies
('Tsunami Warning - Pacific', 5, 'Major tsunami warning issued', 35.6762, 139.6503), -- Tokyo
('Volcano Eruption - Iceland', 4, 'Fagradalsfjall volcano erupting', 63.9170, -22.2700), -- Iceland
('Hurricane - Florida', 4, 'Category 4 hurricane making landfall', 25.7617, -80.1918), -- Miami
('Wildfires - Australia', 5, 'Massive wildfires spreading', -33.8688, 151.2093), -- Sydney
('Terrorist Attack - Paris', 5, 'Coordinated attacks in city center', 48.8566, 2.3522),

-- More varied emergencies
('Cyber Attack - Bank System', 4, 'Major ransomware attack on banking', 40.7128, -74.0060), -- New York
('Nuclear Plant Alert - Ukraine', 5, 'Cooling system failure reported', 51.2763, 30.2219), -- Chernobyl area
('Drought - California', 3, 'Severe drought, water restrictions', 36.7783, -119.4179), -- California
('Pandemic Outbreak - New Strain', 5, 'New virus strain spreading rapidly', 0, 0), -- Global
('Space Debris Alert', 3, 'Satellite collision risk, ISS evacuation', 0, 0); -- Space