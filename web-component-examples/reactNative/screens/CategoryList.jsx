import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Switch, Image, FlatList } from 'react-native'
import React, { useState } from 'react'

const CategoryList = (props) => {

    const { navigation } = props

    const { width, height } = Dimensions.get('window')

    const sideMenu = useState(new Animated.Value(-width / 2))[0]
    const [sideMenuOpen, setSideMenuOpen] = useState(false)
    const [filters, setFilters] = useState({
        multiple: {
            enabled: true,
            horizontal: true,
            vertical: true,
            grid: true,
            solution: true,
        },
        subjective: {
            enabled: true,
        }
    })

    //Small data set for testing
    const QuesitonList = {
        MultipleChoice: [
            { type: "Short Text Question Set", identifier: "do_2138622515299368961170", enabled: filters.multiple.horizontal },
            { type: "Long Text Question Set", identifier: "do_2138622578918113281177", enabled: filters.multiple.vertical },
            { type: "Horizontal Layout Question Set", identifier: "do_2138622515299368961170", enabled: filters.multiple.vertical },
            { type: "Grid Layout Question Set", identifier: "do_2138621952034570241163", enabled: filters.multiple.grid },
            { type: "MCQ with solutions", identifier: "do_2138624000374702081209", enabled: filters.multiple.solution },

        ],
        Subjective: [
            { type: "Subjective Question Set 1", identifier: "do_2138623295549685761189", enabled: true },
            { type: "Subject Question Set 2", identifier: "do_2138623514862387201196", enabled: true },
        ]
    }

    const CategoryBox = ({ data }) => {
        if (data.enabled) {
            return (
                <TouchableOpacity style={styles.boxContainer} onPress={() => navigation.navigate("Questions", {
                    identifier: data.identifier,
                })
                }>
                    <Text style={styles.boxText}>{data?.type}</Text>
                </TouchableOpacity>
            )
        } else {
            return null
        }
    }

    const FilterSwitch = ({ data }) => {
        return (
            <View style={styles.switchContainer}>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={data.onValueChange}
                    value={data.enabled}
                    thumbColor={data.enabled ? 'orange' : '#f4f3f4'}
                    testID={`${data.filter.toLowerCase().replace(' ', '-')}-switch`}
                />
                <Text style={styles.switchText}>
                    {data.filter}
                </Text>
            </View>
        )
    }

    //handles the side menu animation
    const handleSideMenu = () => {
        if (sideMenuOpen) {
            Animated.timing(sideMenu, {
                toValue: -width / 2,
                duration: 300,
                useNativeDriver: true
            }).start()

        } else {
            Animated.timing(sideMenu, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start()
        }

        setSideMenuOpen((prevState) => (!prevState))
    }

    //handles the multiple choice filter
    const handelMulipleFilter = () => {

        const multipleFilterOff = {
            enabled: false,
            horizontal: false,
            vertical: false,
            grid: false,
            solution: false,
        }

        if (filters.multiple.enabled) {
            setFilters((prevState) => ({ ...prevState, multiple: { ...multipleFilterOff } }))
        } else {
            setFilters((prevState) => ({ ...prevState, multiple: { ...prevState.multiple, enabled: true } }))
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={handleSideMenu} style={styles.filterTextContainer} testID={'filter-icon'}>
                    <Image source={{ uri: 'https://img.icons8.com/?size=512&id=3004&format=png', }} style={styles.filterIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.pageHeader}>Choose the content to play</Text>
            </View>
            {
                filters.multiple.enabled && <View style={styles.choiceContainer}>
                    <Text style={styles.choiceHeader}>
                        Multiple choice questions
                    </Text>
                    <FlatList
                        data={QuesitonList?.MultipleChoice}
                        keyExtractor={(item, index) => item.identifier}
                        renderItem={({ item }) => <CategoryBox data={item} />}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            }
            <Animated.View style={[styles.sideMenuConatiner, {
                transform: [
                    { translateX: sideMenu }
                ]
            }]}
                testID={'side-menu'}
            >

                <View style={styles.filterHeaderContainer}>
                    <Text style={styles.filterHeader}>Filters</Text>
                    <TouchableOpacity onPress={handleSideMenu} style={styles.filterCloseContainer}>
                        <Image source={{ uri: 'https://img.icons8.com/?size=512&id=63688&format=png' }} style={styles.filterClose} />
                    </TouchableOpacity>
                </View>

                <View style={styles.categoryFilterContainer}>
                    <FilterSwitch data={{ filter: "Multiple Choice", enabled: filters.multiple.enabled, onValueChange: handelMulipleFilter }} />
                    <View style={styles.subSwitchContainer}>
                        <FilterSwitch data={{ filter: "Horizontal Layout", enabled: filters.multiple.horizontal, onValueChange: () => setFilters((prevState) => ({ ...prevState, multiple: { ...prevState.multiple, horizontal: !prevState.multiple.horizontal, enabled: true } })) }} />
                        <FilterSwitch data={{ filter: "Vertical Layout", enabled: filters.multiple.vertical, onValueChange: () => setFilters((prevState) => ({ ...prevState, multiple: { ...prevState.multiple, vertical: !prevState.multiple.vertical, enabled: true } })) }} />
                        <FilterSwitch data={{ filter: "Grid Layout", enabled: filters.multiple.grid, onValueChange: () => setFilters((prevState) => ({ ...prevState, multiple: { ...prevState.multiple, grid: !prevState.multiple.grid, enabled: true } })) }} />
                        <FilterSwitch data={{ filter: "With Solutions", enabled: filters.multiple.solution, onValueChange: () => setFilters((prevState) => ({ ...prevState, multiple: { ...prevState.multiple, solution: !prevState.multiple.solution, enabled: true } })) }} />
                    </View>
                    <FilterSwitch data={{ filter: "Subjective", enabled: filters.subjective.enabled, onValueChange: () => setFilters((prevState) => ({ ...prevState, subjective: { enabled: !prevState.subjective.enabled } })) }} />
                </View>

            </Animated.View>
            {filters.subjective.enabled && <View style={styles.choiceContainer}>
                <Text style={styles.choiceHeader}>
                    Subjective Questions
                </Text>
                <FlatList
                    data={QuesitonList?.Subjective}
                    keyExtractor={(item, index) => item.identifier}
                    renderItem={({ item }) => <CategoryBox data={item} />}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                />
            </View>}
        </View >
    )
}

export default CategoryList

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        paddingVertical: 10,
        elevation: 2,
        zIndex: 0,
        backgroundColor: '#f5f5f5'
    },
    pageHeader: {
        alignSelf: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        position: 'absolute',
        textAlign: 'center',
        width: '100%',
        zIndex: 0
    },
    filterTextContainer: {
        marginHorizontal: 20,
        marginLeft: 10,
        marginTop: 'auto',
        marginBottom: 'auto',
        zIndex: 2
    },
    filterText: {
        color: 'orange',
        fontSize: 15
    },
    choiceContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30
    },
    boxContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'black',
        elevation: 2,
        minHeight: 180,
        minWidth: 150,
        maxWidth: 190,
        marginHorizontal: 3,
        paddingHorizontal: 8
    },
    choiceHeader: {
        fontSize: 20,
        fontWeight: 'semibold',
        color: 'black',
        marginBottom: 10
    },
    filterIcon: {
        width: 30,
        height: 30
    },
    sideMenuConatiner: {
        position: 'absolute',
        width: '50%',
        height: '100%',
        backgroundColor: '#F3F8FF',
        zIndex: 100
    },
    filterHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    filterHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'orange',
        marginRight: 'auto',
        marginLeft: 10,
        marginBottom: 10
    },
    filterClose: {
        height: 30,
        width: 30,
        paddingHorizontal: 5,
    },
    filterCloseContainer: {
        marginRight: 20,
    },
    categoryFilterContainer: {
        marginVertical: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    switchText: {
        color: 'black'
    },
    subSwitchContainer: {
        alignSelf: 'flex-end',
        marginRight: 10,
        marginBottom: 20
    },
    boxText: {
        color: 'black'
    }
})